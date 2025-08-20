import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// Import configurations and utilities
import { database } from "@/config/database";
import { logger, stream } from "@/utils/logger";
import { AppError } from "@/utils/AppError";

// Import routes
import authRoutes from "@/api/routes/auth.route";
import roomRoutes from "@/api/routes/room.route";
import { handleError } from "./utils/errorHandler";

// Load environment variables
dotenv.config();

class App {
  public app: express.Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3001", 10);

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middlewares
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.ALLOWED_ORIGINS?.split(",")
            : ["http://localhost:3001"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
      handler: (req, res) => {
        throw AppError.tooManyRequests(
          "Too many requests from this IP, please try again later."
        );
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    this.app.use(morgan("combined", { stream }));

    // Static files
    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../uploads"))
    );

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
      next();
    });
  }

  /**
   * Initialize all routes
   */
  private initializeRoutes(): void {
    const apiVersion = process.env.API_VERSION || "v1";
    const basePath = `/api/${apiVersion}`;

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes
    this.app.use(`${basePath}/auth`, authRoutes);
    this.app.use(`${basePath}/rooms`, roomRoutes);

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Hoang Vy Hotel API",
        version: apiVersion,
        documentation: `${req.protocol}://${req.get("host")}/api-docs`,
        endpoints: {
          auth: `${basePath}/auth`,
          health: "/health",
        },
      });
    });

    // 404 handler for undefined routes
    this.app.use("*", (req, res, next) => {
      next(AppError.notFound(`Route ${req.originalUrl} not found`));
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(handleError);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Server is running on port ${this.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(
          `📚 API Base URL: http://localhost:${this.port}/api/${
            process.env.API_VERSION || "v1"
          }`
        );
      });

      // Graceful shutdown
      process.on("SIGTERM", this.gracefulShutdown.bind(this));
      process.on("SIGINT", this.gracefulShutdown.bind(this));
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    logger.info("🛑 Received shutdown signal, starting graceful shutdown...");

    try {
      // Close database connection
      await database.disconnect();
      logger.info("✅ Database connection closed");

      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Create and export app instance
const app = new App();

// Start server if this file is run directly
if (require.main === module) {
  app.start();
}

export default app;
