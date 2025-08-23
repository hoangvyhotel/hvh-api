import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import jwt from "jsonwebtoken";

export type AsyncFunction<TReq extends Request = Request, TRes = Response> = (
  req: TReq,
  res: Response<any>,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async controller function to automatically handle errors
 * @param fn - The async controller function to wrap
 * @returns A wrapped function that handles errors automatically
 */
export const catchAsyncError = <TReq extends Request = Request>(
  fn: AsyncFunction<TReq>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
};

/**
 * Enhanced error handler for controllers that provides specific error codes
 * @param fn - The async controller function to wrap
 * @param defaultErrorCode - Default error code if not specified
 * @returns A wrapped function with enhanced error handling
 */
export const catchAsyncErrorWithCode = <TReq extends Request = Request>(
  fn: AsyncFunction<TReq>,
  defaultErrorCode = "INTERNAL_ERROR"
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await fn(req as TReq, res, next);
    } catch (error: any) {
        if (res.headersSent) return next(error);

        let appError: AppError;

        // Log the original error for debugging (server console)
        try {
          console.error("[catchAsyncError] original error:", error && error.stack ? error.stack : error);
        } catch (logErr) {
          // ignore logging errors
        }

        if (error instanceof AppError) {
          appError = error;
        } else if (error instanceof jwt.JsonWebTokenError) {
          appError = AppError.unauthorized(
            "Mã xác thực không hợp lệ hoặc đã hết hạn.",
            "TOKEN_EXPIRED"
          );
        } else if (error && typeof error === "object" && "code" in error) {
          appError = AppError.fromPrismaError(error);
        } else {
          appError = AppError.internal(
            "An unexpected error occurred",
            defaultErrorCode
          );
        }
        return next(appError);
    }
  };
};
