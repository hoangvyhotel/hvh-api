export interface BaseResponse<T>  {
  succeeded: boolean;
  message: string;
  statusCode: number;
  code?: string;
  data: T | null;
  errors?: Record<string, string[]> | null;
}

export interface PaginationInfo {
  pageNum: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface PageResponse<T> extends BaseResponse<T[]>, PaginationInfo {}
