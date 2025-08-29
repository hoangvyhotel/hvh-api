import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import {
  LoginCredentials,
  LoginRequest,
  RegisterCredentials,
  AdminLoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from "@/types/request/auth";
import {
  UserInfo,
  AuthTokens,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from "@/types/response/auth";
import * as userDb from "../db/user.db";
import { IUsersDocument, Users } from "@/models/Users";
import { generateAccessToken, generateToken } from "@/utils/jwt";
import { Types } from "mongoose";
import { HotelModel } from "@/models/Hotel";

export class AuthService {
  async login(req: LoginRequest): Promise<LoginResponse> {
    // Accept either `userName` (camelCase) or `username` (common payload)
    const { userName, password, username } = req.body as any;

    const identifier = userName || username;

    if (!identifier) {
      // Thiếu identifier - trả về lỗi yêu cầu
      throw AppError.badRequest("Vui lòng cung cấp userName hoặc username");
    }

    let user: IUsersDocument | null = await userDb.getUserByUserName(
      identifier
    );
    if (!user) {
      throw AppError.notFound("Người dùng không tồn tại");
    }
    if (!user.password) {
      throw AppError.unauthorized("Thông tin đăng nhập không hợp lệ");
    }
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Mật khẩu không đúng");
    }
    const userInfo: UserInfo = {
      id: (user._id as Types.ObjectId).toString(),
      userName: user.username,
  role: user.role,
  hotelId: (user.hotelId as Types.ObjectId)?.toString(),
    };

    // Generate tokens and return login response
    const tokens = await generateAccessToken(userInfo);

    return {
      user: userInfo,
      tokens,
    };
  }

  async register(credentials: RegisterRequest): Promise<RegisterResponse> {
    const { username, password, passwordManage, hotelName } = credentials.body;

    try {
      const existingUser = await userDb.getUserByUserName(username);

      if (existingUser) {
        throw AppError.conflict("Tên đăng nhập đã tồn tại trong hệ thống");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const hashedPasswordManage = await bcrypt.hash(passwordManage, salt);

      const { savedUser } = await userDb.registerUserWithHotel(
        username,
        hashedPassword,
        hashedPasswordManage,
        hotelName
      );

      const userInfo: UserInfo = {
        id: (savedUser._id as Types.ObjectId).toString(),
        userName: savedUser.username,
        role: savedUser.role,
      };

      return { user: userInfo };
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      throw error; // Re-throw để controller xử lý
    }
  }

  /**
   * Login using admin credentials (username + passwordManage)
   */
  async loginWithAdmin(req: AdminLoginRequest): Promise<LoginResponse> {
    const { username, passwordManage } = req.body;

    if (!username || !passwordManage) {
      throw AppError.badRequest(
        "Vui lòng cung cấp username và passwordManage",
        "MISSING_CREDENTIALS"
      );
    }

    const user = await userDb.getUserByUserName(username);
    if (!user) {
      throw AppError.notFound("Người dùng không tồn tại", "NON_EXISTING_USER");
    }

    // Verify passwordManage
    const isValid = await bcrypt.compare(
      passwordManage,
      user.passwordManage || ""
    );
    if (!isValid) {
      throw AppError.unauthorized(
        "Thông tin quản trị không hợp lệ",
        "INVALID_ADMIN_CREDENTIALS"
      );
    }

    // Ensure the user has admin role
    const role = (user.role || "").toString();
    if (role.toLowerCase() !== "admin") {
      throw AppError.forbidden(
        "Chỉ tài khoản có role 'admin' mới được phép đăng nhập bằng phương thức admin",
        "FORBIDDEN_ADMIN_LOGIN"
      );
    }

    const userInfo: UserInfo = {
      id: (user._id as Types.ObjectId).toString(),
      userName: user.username,
  role: user.role,
  hotelId: (user.hotelId as Types.ObjectId)?.toString(),
    };

    const tokens = await generateAccessToken(userInfo);

    return { user: userInfo, tokens };
  }

  async updateStaffPassword(request: ChangePasswordRequest) {
    const { userId, currentPassword, newPassword, confirmPassword } = request;

    // Validate input parameters
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      throw AppError.badRequest(
        "Thiếu thông tin bắt buộc",
        "MISSING_REQUIRED_FIELDS"
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest("User ID không hợp lệ", "INVALID_USER_ID");
    }

    const user = await Users.findById(userId);

    if (!user) {
      throw AppError.badRequest("Không tìm thấy người dùng", "USER_NOT_FOUND");
    }

    // Check if user has a password set
    if (!user.password) {
      throw AppError.badRequest(
        "Người dùng chưa có mật khẩu",
        "NO_PASSWORD_SET"
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw AppError.badRequest(
        "Mật khẩu hiện tại không đúng",
        "INCORRECT_CURRENT_PASSWORD"
      );
    }

    if (newPassword !== confirmPassword) {
      throw AppError.badRequest(
        "Mật khẩu mới và xác nhận mật khẩu không khớp",
        "PASSWORD_MISMATCH"
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    return await userDb.modifyPasswordUser(userId, hashedNewPassword);
  }

  async updateAdminPassword(request: ChangePasswordRequest) {
    const { userId, currentPassword, newPassword, confirmPassword } = request;

    // Validate input parameters
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      throw AppError.badRequest(
        "Thiếu thông tin bắt buộc",
        "MISSING_REQUIRED_FIELDS"
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest("User ID không hợp lệ", "INVALID_USER_ID");
    }

    const user = await Users.findById(userId);

    if (!user) {
      throw AppError.badRequest("Không tìm thấy người dùng", "USER_NOT_FOUND");
    }

    // Check if user has a password set
    if (!user.password) {
      throw AppError.badRequest(
        "Người dùng chưa có mật khẩu",
        "NO_PASSWORD_SET"
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw AppError.badRequest(
        "Mật khẩu hiện tại không đúng",
        "INCORRECT_CURRENT_PASSWORD"
      );
    }

    if (newPassword !== confirmPassword) {
      throw AppError.badRequest(
        "Mật khẩu mới và xác nhận mật khẩu không khớp",
        "PASSWORD_MISMATCH"
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    return await userDb.modifyPasswordUser(userId, hashedNewPassword);
  }
}