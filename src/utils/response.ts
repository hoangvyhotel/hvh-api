import { BaseResponse } from "@/types/response/base";
import { AppError } from "./AppError";

export class ResponseHelper {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    message: string = "Success",
    code: string = "SUCCESS"
  ): BaseResponse<T> {
    return {
      succeeded: true,
      message,
      statusCode: 200,
      code,
      data,
      errors: null,
    };
  }

  /**
   * Create an error response
   */
  static error(
    message: string = "Error occurred",
    code: string = "ERROR",
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode,
      code,
      data: null,
      errors: errors || null,
    };
  }

  /**
   * Create a response from AppError
   */
  static fromAppError(error: AppError): BaseResponse<null> {
    return {
      succeeded: false,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      data: null,
      errors: error.metadata,
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    pageNum: number,
    pageSize: number,
    total: number,
    message: string = "Success",
    code: string = "SUCCESS"
  ): BaseResponse<T[]> & {
    pageNum: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      succeeded: true,
      message,
      statusCode: 200,
      code,
      data,
      errors: null,
      pageNum,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Create a validation error response
   */
  static validationError(
    message: string = "Yêu cầu không hợp lệ",
    errors: Record<string, string[]>
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode: 400,
      code: "VALIDATION_ERROR",
      data: null,
      errors,
    };
  }

  /**
   * Create a not found response
   */
  static notFound(
    message: string = "Resource not found",
    code: string = "NOT_FOUND"
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode: 404,
      code,
      data: null,
      errors: null,
    };
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(
    message: string = "Unauthorized",
    code: string = "UNAUTHORIZED"
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode: 401,
      code,
      data: null,
      errors: null,
    };
  }

  /**
   * Create a forbidden response
   */
  static forbidden(
    message: string = "Forbidden",
    code: string = "FORBIDDEN"
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode: 403,
      code,
      data: null,
      errors: null,
    };
  }

  /**
   * Create a conflict response
   */
  static conflict(
    message: string = "Conflict",
    code: string = "CONFLICT"
  ): BaseResponse<null> {
    return {
      succeeded: false,
      message,
      statusCode: 409,
      code,
      data: null,
      errors: null,
    };
  }
}
