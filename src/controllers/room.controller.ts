import { NextFunction, Request, Response } from "express";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { catchAsyncError } from "@/utils/catchAsyncError";
import { AppError } from "@/utils/AppError";
import { ResponseHelper } from "@/utils/response";

import * as roomService from "@/services/room.service";

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
