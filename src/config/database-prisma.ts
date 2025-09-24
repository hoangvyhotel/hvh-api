import { PrismaClient } from "@/generated/prisma";
import { logger } from "@/utils/logger";

export class Database {
  private static instance: Database;
  private prisma: PrismaClient;
  private isConnected = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("✅ Database already connected");
      return;
    }

    try {
      logger.info("⏳ Connecting to MySQL...");

      // Test connection
      await this.prisma.$connect();

      this.isConnected = true;
      logger.info("✅ MySQL Database connected successfully");
    } catch (error) {
      logger.error("❌ MySQL Database connection failed:", error);
      throw new Error(`❌ Database connection failed: ${error}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info("🔌 Database disconnected successfully");
    } catch (error) {
      logger.error("❌ Error disconnecting from database:", error);
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const database = Database.getInstance();
