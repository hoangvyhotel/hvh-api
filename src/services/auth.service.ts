import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import {
  LoginCredentials,
  LoginRequest,
  RegisterCredentials,
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
import {
  ModifiedPathsSnapshot,
  Document,
  Model,
  Types,
  ClientSession,
  DocumentSetOptions,
  QueryOptions,
  MergeType,
  UpdateQuery,
  AnyObject,
  PopulateOptions,
  Query,
  SaveOptions,
  ToObjectOptions,
  UpdateWithAggregationPipeline,
  pathsToSkip,
  Error,
} from "mongoose";
import { generateAccessToken, generateToken } from "@/utils/jwt";

export class AuthService {
  async login(req: LoginRequest): Promise<LoginResponse> {
    // Accept either `userName` (camelCase) or `username` (common payload)
    const { userName, password, username } = req.body as any;

    const identifier = userName || username;

    if (!identifier) {
      // Missing identifier - bad request instead of ambiguous credentials error
      throw AppError.badRequest("userName (or username) is required", "MISSING_USERNAME");
    }

    let user: IUsersDocument | null = await userDb.getUserByUserName(identifier);
    if (!user) {
      throw AppError.notFound("NON_EXISTING_USER");
    }

    if (!user.password) {
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

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    const { username, password, passwordManage } = credentials;
    try {
      // Check if user already exists
      const existingUser = await Users.findOne({ username });

      if (existingUser) {
        throw AppError.conflict("USERNAME_ALREADY_EXISTS");
      }

      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const hashedPasswordManage = await bcrypt.hash(passwordManage, salt);

      // Create new user document
      const newUser = new Users({
        username: username,
        password: hashedPassword,
        passwordManage: hashedPasswordManage,
        role: "STAFF",
      });

      // Save user to database
      const savedUser = await newUser.save();

      const userInfo: UserInfo = {
        id: (savedUser._id as Types.ObjectId).toString(),
        userName: savedUser.username,
        role: savedUser.role,
      };

      const tokens = generateAccessToken(userInfo);

      return {
        user: userInfo,
        tokens,
      };
    } catch (error) {
      console.error("Registration failed:", error);
      throw error; // Re-throw để controller xử lý
    }
  }
  /**
   * Refresh access token
   */
  // async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  //   try {
  //     // Verify refresh token
  //     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

  //     // Get user
  //     const user = await this.getUserById(decoded.userId);
  //     if (!user || user.Status !== "ACT") {
  //       throw AppError.unauthorized("INVALID_REFRESH_TOKEN");
  //     }

  //     // Generate new tokens
  //     const tokens = await this.generateTokens(user);

  //     return { tokens };
  //   } catch (error) {
  //     throw AppError.unauthorized("INVALID_REFRESH_TOKEN");
  //   }
  // }

  // Private helper methods
}
