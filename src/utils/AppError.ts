import { BaseResponse } from "../types/response/base";

export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTH = "AUTH",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  FORBIDDEN = "FORBIDDEN",
  UNAUTHORIZED = "UNAUTHORIZED",
  DATABASE = "DATABASE",
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
  UNKNOWN = "UNKNOWN",
}

export interface ErrorMetadata {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  public readonly type: ErrorType;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number,
    type: ErrorType = ErrorType.INTERNAL,
    metadata: ErrorMetadata = {},
    requestId?: string,
    code?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.type = type;
    this.metadata = metadata;
    this.timestamp = new Date();
    this.requestId = requestId;
    // Ưu tiên code truyền vào, nếu không có thì lấy type
    this.code = code ? code : type;

    // Ensure proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for proper inheritance
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toAPIResponse(): BaseResponse<null> {
    return {
      succeeded: false,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      data: null,
      errors: this.metadata,
    };
  }

  static validation(
    message: string,
    code = "VALIDATION_ERROR",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      400,
      ErrorType.VALIDATION,
      metadata,
      requestId,
      code
    );
  }

  static unauthorized(
    message = "Unauthorized",
    code = "UNAUTHORIZED",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      401,
      ErrorType.UNAUTHORIZED,
      metadata,
      requestId,
      code
    );
  }
  static tooManyRequests(
    message = "Too many requests",
    code = "TOO_MANY_REQUESTS",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      429,
      ErrorType.VALIDATION,
      metadata,
      requestId,
      code
    );
  }
  static forbidden(
    message = "Forbidden",
    code = "FORBIDDEN",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      403,
      ErrorType.FORBIDDEN,
      metadata,
      requestId,
      code
    );
  }

  static notFound(
    message = "Resource not found",
    code = "NOT_FOUND",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      404,
      ErrorType.NOT_FOUND,
      metadata,
      requestId,
      code
    );
  }

  static conflict(
    message = "Conflict",
    code = "CONFLICT",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      409,
      ErrorType.CONFLICT,
      metadata,
      requestId,
      code
    );
  }

  static database(
    message = "Database error",
    code = "DATABASE_ERROR",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      500,
      ErrorType.DATABASE,
      metadata,
      requestId,
      code
    );
  }

  static internal(
    message = "Internal server error",
    code = "INTERNAL_ERROR",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      500,
      ErrorType.INTERNAL,
      metadata,
      requestId,
      code
    );
  }

  static external(
    message = "External service error",
    code = "EXTERNAL_ERROR",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      502,
      ErrorType.EXTERNAL,
      metadata,
      requestId,
      code
    );
  }

  static fromPrismaError(prismaError: any): AppError {
    switch (prismaError.code) {
      case "P2002":
        return AppError.conflict(
          "Duplicate field value",
          "DUPLICATE_FIELD",
          prismaError.meta
        );
      case "P2025":
        return AppError.notFound("Record not found", "RECORD_NOT_FOUND");
      default:
        return AppError.database(
          "Unhandled Prisma error",
          "PRISMA_ERROR",
          prismaError.meta
        );
    }
  }

  static badRequest(
    message = "Bad request",
    code = "BAD_REQUEST",
    metadata: ErrorMetadata = {},
    requestId?: string
  ): AppError {
    return new AppError(
      message,
      400,
      ErrorType.VALIDATION,
      metadata,
      requestId,
      code
    );
  }
}
