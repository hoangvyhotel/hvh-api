import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";

// Import Prisma database
import { database } from "@/config/database-prisma";

// Import routes
import apiRoutes from "@/api";

// Import middleware
import { handleError } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";
import { createAdminUser } from "@/utils/create-admin";

// Load environment variables
config();

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    logger.info("🌐 CORS Allowed Origins:", allowedOrigins);

    this.app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
        ],
      })
    );

    // Security middleware
    this.app.use(helmet());

    // Logging middleware
    this.app.use(
      morgan("combined", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use("/api/v1", apiRoutes);

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        message: "Server is running with MySQL!",
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(handleError);
  }

  public async start(): Promise<void> {
    try {
      // Connect to MySQL database
      await database.connect();

      // Create admin user if not exists
      await createAdminUser();

      const port = process.env.PORT || 3001;
      this.app.listen(port, () => {
        logger.info(`🚀 Server is running on port ${port}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
        logger.info(`📊 Database: MySQL with Prisma`);
      });
    } catch (error) {
      logger.error("❌ Failed to start server:", error);
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

export default App;
