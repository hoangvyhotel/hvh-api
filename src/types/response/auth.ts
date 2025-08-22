import { BaseResponse } from "./base";

export interface UserInfo {
  id: string;
  userName: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse {
  user: UserInfo;
  tokens: string;
}

export interface TwoFactorAuthResponse {
  require2FA: boolean;
  methods?: string[];
  userId?: string;
}

export interface RegisterResponse {
  user: UserInfo;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface LogoutResponse {
  message: string;
  loggedOut: boolean;
}

export interface ProfileResponse {
  user: UserInfo;
}

export interface PasswordChangeResponse {
  message: string;
  changed: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  sent: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  reset: boolean;
}

// Response types for API
export type LoginApiResponse = BaseResponse<LoginResponse>;
export type TwoFactorAuthApiResponse = BaseResponse<TwoFactorAuthResponse>;
export type RegisterApiResponse = BaseResponse<RegisterResponse>;
export type RefreshTokenApiResponse = BaseResponse<RefreshTokenResponse>;
export type LogoutApiResponse = BaseResponse<LogoutResponse>;
export type ProfileApiResponse = BaseResponse<ProfileResponse>;
export type PasswordChangeApiResponse = BaseResponse<PasswordChangeResponse>;
export type ForgotPasswordApiResponse = BaseResponse<ForgotPasswordResponse>;
export type ResetPasswordApiResponse = BaseResponse<ResetPasswordResponse>;
