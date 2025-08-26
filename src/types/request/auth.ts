import { BodyRequest } from "./base";

export interface LoginCredentials {
  userName?: string;
  password: string;
}

export interface AdminLoginCredentials {
  username: string;
  passwordManage: string;
}
export interface RegisterCredentials {
  username: string;
  password: string;
  passwordManage: string;
  hotelName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Request types for controllers
export type LoginRequest = BodyRequest<LoginCredentials>;
export type AdminLoginRequest = BodyRequest<AdminLoginCredentials>;
export type RegisterRequest = BodyRequest<RegisterCredentials>;
export type RefreshTokenBodyRequest = BodyRequest<RefreshTokenRequest>;
export type ChangePasswordBodyRequest = BodyRequest<ChangePasswordRequest>;
export type ForgotPasswordBodyRequest = BodyRequest<ForgotPasswordRequest>;
export type ResetPasswordBodyRequest = BodyRequest<ResetPasswordRequest>;
export type UpdateProfileBodyRequest = BodyRequest<UpdateProfileRequest>;
