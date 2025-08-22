import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import {
  LoginCredentials,
  LoginRequest,
  RegisterCredentials,
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
    const { userName, password } = req.body;

    let user: IUsersDocument | null = null;

    if (userName) {
      user = await userDb.getUserByUserName(userName);
      if (!user) throw AppError.notFound("NON_EXISTING_USER");
    }

    if (!user || !user.password) {
      throw AppError.unauthorized("INVALID_CREDENTIALS");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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
      console.error("Tạo người dùng thất bại:", error);
      throw error;
    }
  }
}
