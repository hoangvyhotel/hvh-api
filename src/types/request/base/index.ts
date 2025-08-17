import { CodeStatus } from "@/constant/constant";
import { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  userName: string;
  email: string;
  status: string;
}

// Định nghĩa request có xác thực người dùng
// Tất cả các request có xác thực sẽ kế thừa từ AuthenticatedRequest
export interface AuthenticatedRequest<TParams = any, TBody = any, TQuery = any>
  extends Request<TParams, any, TBody, TQuery> {
  user: AuthenticatedUser;
}

export type AuthOnlyRequest = AuthenticatedRequest<any, any, any>;
export type AuthWithParams<TParams> = AuthenticatedRequest<TParams>;
export type AuthWithQuery<TQuery> = AuthenticatedRequest<any, any, TQuery>;
export type AuthWithBody<TBody> = AuthenticatedRequest<any, TBody, any>;

// Khi không cần xác thực
export type BodyRequest<T> = Request<any, any, T>;
export type QueryRequest<T> = Request<any, any, any, T>;
export type ParamsRequest<T> = Request<T>;
export type FullRequest<TBody, TQuery, TParams> = Request<
  TParams,
  any,
  TBody,
  TQuery
>;

// Định nghĩa các request cơ bản cho danh sách
// Các request này có thể được sử dụng cho các API cần phân trang, tìm kiếm, lọc
export interface BaseListRequest {
  pageNum?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  filters?: Record<string, unknown>;
  status?: CodeStatus;
  searchBy?: string;
}
