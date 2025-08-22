import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import { ResponseHelper } from "@/utils/response";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";

interface UserPayload {
  userId: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Authenticate user middleware
 */
export const authenticate = catchAsyncErrorWithCode(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Get token from cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json(
      ResponseHelper.unauthorized(
        "You are not logged in. Please log in to get access.",
        "NO_TOKEN"
      )
    );
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(
        ResponseHelper.unauthorized(
          "Invalid token. Please log in again.",
          "INVALID_TOKEN"
        )
      );
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(
        ResponseHelper.unauthorized(
          "Your token has expired. Please log in again.",
          "TOKEN_EXPIRED"
        )
      );
    } else {
      res.status(401).json(
        ResponseHelper.unauthorized(
          "Authentication failed. Please log in again.",
          "AUTHENTICATION_FAILED"
        )
      );
    }
  }
}, "AUTH_MIDDLEWARE_ERROR");

/**
 * Authorize user by role
 */
export const authorize = (...roles: string[]) => {
  return catchAsyncErrorWithCode(async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      res.status(401).json(
        ResponseHelper.unauthorized(
          "You are not logged in. Please log in to get access.",
          "NO_USER"
        )
      );
      return;
    }

    if (!roles.includes(req.user.role || "")) {
      res.status(403).json(
        ResponseHelper.forbidden(
          `User role '${req.user.role}' is not authorized to access this route.`,
          "INSUFFICIENT_PERMISSIONS"
        )
      );
      return;
    }

    next();
  }, "AUTHORIZATION_ERROR");
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = catchAsyncErrorWithCode(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Get token from cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
      
      // Add user to request
      req.user = decoded;
    } catch (error) {
      // Don't fail, just don't set user
      console.log("Optional auth failed:", error);
    }
  }

  next();
}, "OPTIONAL_AUTH_ERROR"); 