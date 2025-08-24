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
import { UpdateRangePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import {
  RoomResponse,
  RoomResponseWithHotel,
} from "@/types/response/roomResponse";
import { BaseResponse } from "@/types/response";

export const getRoomById = catchAsyncError(
  async (req: ParamsRequest<{ roomId: string }>, res: Response) => {
    const roomId = req.params.roomId;
    const room = await roomService.getRoomById(roomId);

    if (!room) {
      throw new AppError("Phòng không tồn tại", 404);
    }

    const response = ResponseHelper.success(
      room,
      "Lấy thông tin phòng thành công"
    );
    res.status(200).json(response);
  }
);

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

export const updateRoom = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ roomId: string }>,
    res: Response<BaseResponse<RoomResponse>>,
    next: NextFunction
  ) => {
    const roomId = req.params.roomId;
    const updateRoomData = req.body;
    const result = await roomService.updateRoom(roomId, updateRoomData);

    res.status(200).json(result);
  },
  "UPDATE_ERROR"
);
