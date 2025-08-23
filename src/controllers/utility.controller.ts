import { Response } from "express";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { UtilityService } from "@/services/utility.service";
import { AppError } from "@/utils/AppError";
import { CreateUtilityRequest, UpdateUtilityRequest } from "@/types/request/utility";
import { QueryRequest } from "@/types/request/base";

const service = new UtilityService();

export const createUtility = catchAsyncErrorWithCode(async (req: CreateUtilityRequest, res: Response) => {
  const result = await service.create(req.body);
  res.status(201).json(ResponseHelper.success(result, "Tạo tiện ích thành công"));
}, "UTILITY_CREATE_ERROR");

export const listUtilities = catchAsyncErrorWithCode(async (req: QueryRequest<{ hotelId?: string }>, res: Response) => {
  const { hotelId } = req.query;
  if (!hotelId) {
    throw AppError.badRequest("hotelId là bắt buộc", "MISSING_HOTEL_ID");
  }
  const result = await service.list({ hotelId: hotelId as string });
  res.status(200).json(ResponseHelper.success(result.items, "Lấy danh sách tiện ích thành công"));
}, "UTILITY_LIST_ERROR");

export const getUtility = catchAsyncErrorWithCode(async (req: any, res: Response) => {
  const { id } = req.params;
  const result = await service.getById(id);
  res.status(200).json(ResponseHelper.success(result, "Lấy thông tin tiện ích thành công"));
}, "UTILITY_GET_ERROR");

export const updateUtility = catchAsyncErrorWithCode(async (req: UpdateUtilityRequest, res: Response) => {
  const { id } = req.params;
  const result = await service.update(id, req.body);
  res.status(200).json(ResponseHelper.success(result, "Cập nhật tiện ích thành công"));
}, "UTILITY_UPDATE_ERROR");

export const deleteUtility = catchAsyncErrorWithCode(async (req: any, res: Response) => {
  const { id } = req.params;
  await service.delete(id);
  res.status(200).json(ResponseHelper.success({ deleted: true }, "Xóa tiện ích thành công"));
}, "UTILITY_DELETE_ERROR");

