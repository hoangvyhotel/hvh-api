require("dotenv").config();
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { UserInfo } from "@/types/response";
import { Response, Request } from "express";
import dotenv from 'dotenv';
dotenv.config();

// Config interface
interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  activationSecret: string;
}


// Parse environment variables
const config: JwtConfig = {
  accessTokenSecret: process.env.JWT_SECRET || '',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || '',
  activationSecret: process.env.JWT_ACTIVATION_SECRET || ''
};

// Validate config
if (!config.accessTokenSecret || !config.refreshTokenSecret || !config.activationSecret) {
  throw new Error('JWT configuration is incomplete');
}

// Token options interface
interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Token expiration times
const accessTokenExpire = parseInt(process.env.JWT_EXPIRES_IN || '3600', 10); // 1 hour default
const refreshTokenExpire = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10); // 7 days default

// Cookie options
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 1000),
  maxAge: accessTokenExpire * 1000,
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 1000),
  maxAge: refreshTokenExpire * 1000,
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

// JWT Payload interface
interface JwtUserPayload {
  id: string;
  name: string;
  role?: string;
}

/**
 * Creates a clean JWT payload from UserInfo
 */
const createJwtPayload = (user: UserInfo): JwtUserPayload => ({
  id: user.id.toString(),
  name: user.userName,
  ...(user.role && { role: user.role })
});

/**
 * Generates signed JWT token with proper typing
 */
export const generateToken = (
  payload: object,
  secret: string,
  expiresIn: number | string,
  options?: SignOptions
): string => {
  const signOptions: SignOptions = {
    expiresIn: typeof expiresIn === 'string' ? parseInt(expiresIn, 10) : expiresIn,
    algorithm: 'HS256',
    ...options
  };
  return jwt.sign(payload, secret, signOptions);
};

/**
 * Generates access token
 */
export const generateAccessToken = (user: UserInfo): string => {
  const payload = { user: createJwtPayload(user) };
  return generateToken(payload, config.accessTokenSecret, accessTokenExpire);
};

/**
 * Generates refresh token
 */
export const generateRefreshToken = (user: UserInfo): string => {
  const payload = { user: createJwtPayload(user) };
  return generateToken(payload, config.refreshTokenSecret, refreshTokenExpire);
};

/**
 * Creates both access and refresh tokens
 */
export const createAccessRefreshToken = (
  user: UserInfo
): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
} => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  expiresIn: accessTokenExpire,
  tokenType: "Bearer"
});

/**
 * Sends tokens to client
 */
export const sendToken = async (
  user: UserInfo,
  statusCode: number,
  res: Response,
  req?: Request
): Promise<void> => {
  const { accessToken, refreshToken } = createAccessRefreshToken(user);
  
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.cookie("access_token", accessToken, accessTokenOptions);

  res.status(statusCode).json({
    success: true,
    data: {
      accessToken,
      expiresIn: accessTokenExpire,
      tokenType: "Bearer"
    },
    message: "Login successful",
    code: "LOGIN_SUCCESS"
  });
};

/**
 * Verifies refresh token with proper typing
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.refreshTokenSecret) as JwtPayload;
};

/**
 * Clears authentication cookies
 */
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("refresh_token");
  res.clearCookie("access_token");
};

/**
 * Generates activation token
 */
export const createActivationToken = (
  user: UserInfo,
  activationCode: string
): { token: string; activationCode: string } => {
  const payload = {
    user: {
      id: user.id.toString(),
      userName: user.userName
    },
    activationCode
  };

  const token = generateToken(payload, config.activationSecret, "5m");
  return { token, activationCode };
};

/**
 * Generates short-lived activation token
 */
export const createShortActivationToken = (
  user: UserInfo,
  activationCode: string
): { token: string; activationCode: string } => {
  const payload = {
    user: {
      id: user.id.toString(),
      userName: user.userName
    },
    activationCode
  };

  const token = generateToken(payload, config.activationSecret, "2m");
  return { token, activationCode };
};

// Helper functions
export const getAccessTokenFromCookie = (req: Request): string | null => 
  req.cookies?.access_token || null;

export const getRefreshTokenFromCookie = (req: Request): string | null => 
  req.cookies?.refresh_token || null;