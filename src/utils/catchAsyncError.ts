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
      if (error instanceof AppError) {
        res.status(error.statusCode).json(ResponseHelper.fromAppError(error));
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Mã xác thực không hợp lệ hoặc đã hết hạn.",
              "TOKEN_EXPIRED"
            )
          );
      }

      if (error && typeof error === "object" && "code" in error) {
        res
          .status(500)
          .json(ResponseHelper.fromAppError(AppError.fromPrismaError(error)));
      }

      res
        .status(500)
        .json(
          ResponseHelper.error("An unexpected error occurred", defaultErrorCode)
        );
    }
  };
};
