import { NextFunction, Request, Response } from "express";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import {
  catchAsyncError,
  catchAsyncErrorWithCode,
} from "@/utils/catchAsyncError";
import { AppError } from "@/utils/AppError";
import { ResponseHelper } from "@/utils/response";

import * as roomService from "@/services/room.service";
import { BodyRequest, ParamsRequest, QueryRequest } from "@/types/request";
import {
  GetRoomAvailableResponse,
  RoomResponse,
  RoomResponseWithHotel,
} from "@/types/response/roomResponse";
import { BaseResponse } from "@/types/response";
import { UpdateRangePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import { UpdateRoomRequest } from "@/types/request/room/UpdateRoomRequest.type";

// CREATE - Tạo room mới
export const createRoom = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const roomData: CreateRoomRequest = req.body;

    // Validate required fields
    if (!roomData.floor || !roomData.originalPrice || !roomData.hotelId) {
      return next(new AppError("Thiếu thông tin bắt buộc", 400));
    }

    const room = await roomService.create(roomData);

    const response = ResponseHelper.success(room, "Tạo phòng thành công");
    res.status(201).json(response);
  }
);

export const getAllRooms = catchAsyncErrorWithCode(
  async (
    req: QueryRequest<{ id: string; isGetAll?: string }>,
    res: Response<RoomResponseWithHotel>
  ) => {
    const result = await roomService.getAllRooms(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const updateRoom = catchAsyncErrorWithCode(
  async (req: BodyRequest<UpdateRoomRequest>, res: Response) => {
    const roomId = req.params.id;
    const roomData = req.body;

    const room = await roomService.updateRoom(roomId, roomData);

    const response = ResponseHelper.success(
      room,
      "Cập nhật thông tin phòng thành công",
      "UPDATE_SUCCESS"
    );
    res.status(200).json(response);
  },
  "UPDATE_ERROR"
);

export const updateStatus = catchAsyncErrorWithCode(
  async (req: BodyRequest<{ status: boolean }>, res: Response) => {
    const roomId = req.params.id;
    const { status } = req.body;

    const updatedRoom = await roomService.updateStatus(roomId, status);

    const response = ResponseHelper.success(
      updatedRoom,
      "Cập nhật trạng thái phòng thành công",
      "UPDATE_STATUS_SUCCESS"
    );
    res.status(200).json(response);
  },
  "UPDATE_STATUS_ERROR"
);

export const getRoomById = catchAsyncErrorWithCode(
  async (req: ParamsRequest<{ id: string }>, res: Response) => {
    const room = await roomService.getRoomById(req.params.id);
    const response = ResponseHelper.success(
      room,
      "Lấy thông tin phòng thành công",
      "FETCH_SUCCESS"
    );
    res.status(200).json(response);
  },
  "FETCH_ERROR"
);

export const getAllRoomsByHotelId = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<RoomResponseWithHotel>
  ) => {
    const result = await roomService.getAllRoomsByHotelId(req);

    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const updateRangePrice = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<UpdateRangePrice>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await roomService.updateRangePrice(req);
    res.status(201).json(result);
  },
  "UPDATE_RANGE_ERROR"
);

export const getRoomAvailable = catchAsyncErrorWithCode(
  async (
    req: QueryRequest<{ roomId: string; hotelId: string }>,
    res: Response<GetRoomAvailableResponse>
  ) => {
    const result = await roomService.getRoomAvailable(req);
    res.status(201).json(result);
  },
  "FETCH_ERROR"
);
