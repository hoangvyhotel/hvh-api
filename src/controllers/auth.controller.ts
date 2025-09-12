import { Response } from "express";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { AuthService } from "@/services/auth.service";
import {
  ChangePasswordBodyRequest,
  LoginRequest,
  RegisterRequest,
} from "@/types/request/auth";
import { AuthenticatedRequest } from "@/types/request/base";
import { AdminLoginRequest } from "@/types/request/auth";

const authService = new AuthService();

/**
 * Login user
 */
export const login = catchAsyncErrorWithCode(
  async (req: LoginRequest, res: Response) => {
    const result = await authService.login(req);

    // Only return user info on successful login. Tokens are not sent here.
      const { user } = result as any;

      // return only username, role, hotelId as requested
      const payload = {
        username: user.userName,
        role: user.role,
        hotelId: user.hotelId,
      };

      res.status(200).json(ResponseHelper.success({ user: payload }, "Login successful", "LOGIN_SUCCESS"));
  },
  "LOGIN_ERROR"
);

/**
 * Admin login using username + passwordManage
 */
export const loginWithAdmin = catchAsyncErrorWithCode(
  async (req: AdminLoginRequest, res: Response) => {
    const result = await authService.loginWithAdmin(req);
    const { user } = result as any;
      const payload = {
        username: user.userName,
        role: user.role,
        hotelId: user.hotelId,
      };

    res
      .status(200)
      .json(
        ResponseHelper.success(
          { user },
          "Đăng nhập quản trị viên thành công",
          "LOGIN_SUCCESS"
        )
      );
  },
  "LOGIN_ADMIN_ERROR"
);

/**
 * Register new user
 */
export const register = catchAsyncErrorWithCode(
  async (req: RegisterRequest, res: Response) => {
    const result = await authService.register(req);

    res
      .status(201)
      .json(
        ResponseHelper.success(
          result,
          "Tạo mới người dùng thành công",
          "REGISTER_SUCCESS"
        )
      );
  },
  "REGISTER_ERROR"
);

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
export const logout = catchAsyncErrorWithCode(
  async (req: AuthenticatedRequest, res: Response) => {
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
  },
  "LOGOUT_ERROR"
);

export const changeStaffPassword = catchAsyncErrorWithCode(
  async (req: ChangePasswordBodyRequest, res: Response) => {
    const result = await authService.updateStaffPassword(req.body);
    res
      .status(200)
      .json(
        ResponseHelper.success(
          result,
          "Password changed successfully",
          "PASSWORD_CHANGE_SUCCESS"
        )
      );
  },
  "PASSWORD_CHANGE_ERROR"
);

export const changeAdminPassword = catchAsyncErrorWithCode(
  async (req: ChangePasswordBodyRequest, res: Response) => {
    const result = await authService.updateAdminPassword(req.body);
    res
      .status(200)
      .json(
        ResponseHelper.success(
          result,
          "Admin password changed successfully",
          "PASSWORD_CHANGE_SUCCESS"
        )
      );
  },
  "PASSWORD_CHANGE_ERROR"
);
