import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import {
  LoginCredentials,
  LoginRequest,
  RegisterCredentials,
  AdminLoginRequest,
  RegisterRequest,
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

    let user: IUsersDocument | null = await userDb.getUserByUserName(identifier);
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
      throw AppError.unauthorized("WRONG_PASSWORD");
    }
    const userInfo: UserInfo = {
      id: (user._id as Types.ObjectId).toString(),
      userName: user.username,
      role: user.role,
    };

    // Generate tokens and return login response
    const tokens = await generateAccessToken(userInfo);

    return {
      user: userInfo,
      tokens,
    };
  };

  
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
      throw AppError.badRequest("Vui lòng cung cấp username và passwordManage", "MISSING_CREDENTIALS");
    }

    const user = await userDb.getUserByUserName(username);
    if (!user) {
      throw AppError.notFound("Người dùng không tồn tại", "NON_EXISTING_USER");
    }

    // Verify passwordManage
    const isValid = await bcrypt.compare(passwordManage, user.passwordManage || "");
    if (!isValid) {
      throw AppError.unauthorized("Thông tin quản trị không hợp lệ", "INVALID_ADMIN_CREDENTIALS");
    }

    const userInfo: UserInfo = {
      id: (user._id as Types.ObjectId).toString(),
      userName: user.username,
      role: user.role,
    };

    const tokens = await generateAccessToken(userInfo);

    return { user: userInfo, tokens };
 
  }
}
