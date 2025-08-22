// src/utils/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { AppError } from './AppError';
import { BaseResponse } from '../types/response/base';

export const handleError = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error chi tiết
  logger.error(err.message, {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Xác định xem có phải là AppError không
  let error = err;
  if (!(err instanceof AppError)) {
    // Nếu không phải AppError, chuyển thành AppError
    error = AppError.internal("Internal server error", "INTERNAL");
  }

  const appError = error as AppError;

  // Chuẩn bị response
  const response: BaseResponse<null> = {
    succeeded: false,
    message: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    data: null,
    errors: appError.metadata,
    ...(process.env.NODE_ENV === 'development' && { stack: appError.stack })
  };

  // Gửi response
  res.status(appError.statusCode).json(response);
};

// Middleware cho route không tồn tại
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.originalUrl} not found`));
};