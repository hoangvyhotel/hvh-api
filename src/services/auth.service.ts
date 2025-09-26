import bcrypt from "bcryptjs";
import { AppError } from "@/utils/AppError";
import {
  LoginRequest,
  RegisterRequest,
  AdminLoginRequest,
  ChangePasswordRequest,
} from "@/types/request/auth";
import {
  UserInfo,
  LoginResponse,
  RegisterResponse,
} from "@/types/response/auth";
import { generateAccessToken } from "@/utils/jwt";
import { PrismaClient } from "../generated/prisma";
import { database } from "@/config/database-prisma";

const prisma = database.getClient();

export class AuthService {
  async login(req: LoginRequest): Promise<LoginResponse> {
    const { userName, password, username } = req.body as any;
    const identifier = userName || username;

    if (!identifier) {
      throw AppError.badRequest("Vui lòng cung cấp userName hoặc username");
    }

    const user = await prisma.user.findUnique({
      where: { username: identifier },
      include: { hotel: true },
    });

    if (!user) {
      throw AppError.notFound("Người dùng không tồn tại");
    }

    if (!user.password) {
      throw AppError.unauthorized("Thông tin đăng nhập không hợp lệ");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Mật khẩu không đúng");
    }

    if (!user.hotel) {
      throw AppError.notFound("Khách sạn không tồn tại");
    }

    const userInfo: UserInfo = {
      id: user.id.toString(),
      userName: user.username,
      role: user.role,
      hotelName: user.hotel.name,
      hotelId: user.hotel.id.toString(),
    };

    const tokens = await generateAccessToken(userInfo);

    return { user: userInfo, tokens };
  }

  async register(credentials: RegisterRequest): Promise<RegisterResponse> {
    const { username, password, passwordManage, hotelName } = credentials.body;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw AppError.conflict("Tên đăng nhập đã tồn tại trong hệ thống");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPasswordManage = await bcrypt.hash(passwordManage, salt);

    // Tạo hotel + user trong transaction
    const { user } = await prisma.$transaction(
      async (tx: {
        hotel: { create: (arg0: { data: { name: string } }) => any };
        user: {
          create: (arg0: {
            data: {
              username: string;
              password: string;
              passwordManage: string;
              role: string; // mặc định, hoặc bạn truyền từ ngoài
              hotelId: any;
            };
          }) => any;
        };
      }) => {
        const hotel = await tx.hotel.create({
          data: { name: hotelName },
        });

        const user = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            passwordManage: hashedPasswordManage,
            role: "staff", // mặc định, hoặc bạn truyền từ ngoài
            hotelId: hotel.id,
          },
        });

        return { hotel, user };
      }
    );

    const userInfo: UserInfo = {
      id: user.id.toString(),
      userName: user.username,
      role: user.role,
    };

    return { user: userInfo };
  }

  async loginWithAdmin(req: AdminLoginRequest): Promise<LoginResponse> {
    const { username, passwordManage } = req.body;

    if (!username || !passwordManage) {
      throw AppError.badRequest("Vui lòng cung cấp username và passwordManage");
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw AppError.notFound("Người dùng không tồn tại");
    }

    const isValid = await bcrypt.compare(
      passwordManage,
      user.passwordManage ?? ""
    );
    if (!isValid) {
      throw AppError.unauthorized("Thông tin quản trị không hợp lệ");
    }

    const userInfo: UserInfo = {
      id: user.id.toString(),
      userName: user.username,
      role: user.role,
      hotelId: user.hotelId.toString(),
    };

    const tokens = await generateAccessToken(userInfo);
    return { user: userInfo, tokens };
  }

  async updateStaffPassword(request: ChangePasswordRequest) {
    const { username, currentPassword, newPassword, confirmPassword } = request;

    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      throw AppError.badRequest("Thiếu thông tin bắt buộc");
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw AppError.badRequest("Không tìm thấy người dùng");
    }

    if (!user.password) {
      throw AppError.badRequest("Người dùng chưa có mật khẩu");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw AppError.badRequest("Mật khẩu hiện tại không đúng");
    }

    if (newPassword !== confirmPassword) {
      throw AppError.badRequest("Mật khẩu mới và xác nhận mật khẩu không khớp");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    return await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });
  }

  async updateAdminPassword(request: ChangePasswordRequest) {
    const { username, currentPassword, newPassword, confirmPassword } = request;

    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      throw AppError.badRequest("Thiếu thông tin bắt buộc");
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw AppError.badRequest("Không tìm thấy người dùng");
    }

    if (!user.passwordManage) {
      throw AppError.badRequest("Người dùng chưa có mật khẩu quản trị");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordManage
    );
    if (!isPasswordValid) {
      throw AppError.badRequest("Mật khẩu hiện tại không đúng");
    }

    if (newPassword !== confirmPassword) {
      throw AppError.badRequest("Mật khẩu mới và xác nhận mật khẩu không khớp");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    return await prisma.user.update({
      where: { id: user.id },
      data: { passwordManage: hashedNewPassword },
    });
  }
}
