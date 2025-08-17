import { Response } from "express";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { AuthService } from "@/services/auth.service";
import {
  LoginRequest,
  RegisterRequest,
} from "@/types/request/auth";
import { AuthenticatedRequest } from "@/types/request/base";

const authService = new AuthService();

/**
 * Send token response helper function
 */
const sendToken = (user: any, statusCode: number, res: Response, req: any) => {
  const token = user.getJWTToken();
  const refreshToken = user.getRefreshToken();

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json(
    ResponseHelper.success(
      {
        user: {
          id: user.Id,
          email: user.Email,
          userName: user.UserName,
          firstName: user.FirstName,
          lastName: user.LastName,
          phone: user.Phone,
          status: user.Status,
          role: user.Role,
          isEmailConfirmed: user.IsEmailConfirmed,
          createdAt: user.CreatedAt,
          updatedAt: user.UpdatedAt,
        },
        tokens: {
          accessToken: token,
          refreshToken,
          expiresIn: 7 * 24 * 60 * 60,
          tokenType: "Bearer",
        },
      },
      "Login successful",
      "LOGIN_SUCCESS"
    )
  );
};

/**
 * Login user
 */
export const login = catchAsyncErrorWithCode(async (req: LoginRequest, res: Response) => {
  const result = await authService.login(req);

  res.status(200).json(
    ResponseHelper.success(
      result,
      "Login successful",
      "LOGIN_SUCCESS"
    )
  );
}, "LOGIN_ERROR");


/**
 * Register new user
 */
export const register = catchAsyncErrorWithCode(async (req: RegisterRequest, res: Response) => {
  const result = await authService.register(req.body);
  
  res.status(201).json(
    ResponseHelper.success(
      result,
      "User registered successfully",
      "REGISTER_SUCCESS"
    )
  );
}, "REGISTER_ERROR");

/**
 * Refresh token
 */
// export const refreshToken = catchAsyncErrorWithCode(async (req: RefreshTokenBodyRequest, res: Response) => {
//   const { refreshToken } = req.body;
//   const result = await authService.refreshToken(refreshToken);
  
//   res.status(200).json(
//     ResponseHelper.success(
//       result,
//       "Token refreshed successfully",
//       "TOKEN_REFRESH_SUCCESS"
//     )
//   );
// }, "TOKEN_REFRESH_ERROR");

/**
 * Logout user
 */
export const logout = catchAsyncErrorWithCode(async (req: AuthenticatedRequest, res: Response) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json(
    ResponseHelper.success(
      {
        message: "Logged out successfully",
        loggedOut: true,
      },
      "Logout successful",
      "LOGOUT_SUCCESS"
    )
  );
}, "LOGOUT_ERROR");

