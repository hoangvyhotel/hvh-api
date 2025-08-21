import { Response } from "express";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { UtilityService } from "@/services/utility.service";
import { CreateUtilityRequest, UpdateUtilityRequest } from "@/types/request/utility";

const service = new UtilityService();

export const createUtility = catchAsyncErrorWithCode(async (req: CreateUtilityRequest, res: Response) => {
  const result = await service.create(req.body);
  res.status(201).json(ResponseHelper.success(result, "Utility created", "UTILITY_CREATE_SUCCESS"));
}, "UTILITY_CREATE_ERROR");

export const listUtilities = catchAsyncErrorWithCode(async (req: any, res: Response) => {
  const { hotelId, status } = req.query;
  const result = await service.list({ hotelId, status });
  res.status(200).json(ResponseHelper.success(result.items, "Utilities fetched", "UTILITY_LIST_SUCCESS"));
}, "UTILITY_LIST_ERROR");

export const getUtility = catchAsyncErrorWithCode(async (req: any, res: Response) => {
  const { id } = req.params;
  const result = await service.getById(id);
  res.status(200).json(ResponseHelper.success(result, "Utility fetched", "UTILITY_GET_SUCCESS"));
}, "UTILITY_GET_ERROR");

export const updateUtility = catchAsyncErrorWithCode(async (req: UpdateUtilityRequest, res: Response) => {
  const { id } = req.params;
  const result = await service.update(id, req.body);
  res.status(200).json(ResponseHelper.success(result, "Utility updated", "UTILITY_UPDATE_SUCCESS"));
}, "UTILITY_UPDATE_ERROR");

export const deleteUtility = catchAsyncErrorWithCode(async (req: any, res: Response) => {
  const { id } = req.params;
  await service.delete(id);
  res.status(200).json(ResponseHelper.success({ deleted: true }, "Utility deleted", "UTILITY_DELETE_SUCCESS"));
}, "UTILITY_DELETE_ERROR");
