import { NextFunction, Request, Response } from "express";
import * as roomDb from "@/db/room.db";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { UpdateRoomRequest } from "@/types/request/room/UpdateRoomRequest.type";
import { catchAsyncError } from "@/utils/catchAsyncError";
import { AppError } from "@/utils/AppError";
import { ResponseHelper } from "@/utils/response";

// CREATE - Tạo room mới
export const createRoom = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const roomData: CreateRoomRequest = req.body;

    // Validate required fields
    if (!roomData.floor || !roomData.originalPrice || !roomData.hotelId) {
      return next(new AppError("Thiếu thông tin bắt buộc", 400));
    }

    const room = await roomDb.create(roomData);

    const response = ResponseHelper.success(room, "Tạo phòng thành công");
    res.status(201).json(response);
  }
);

// READ - Lấy tất cả rooms
export const getAllRooms = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const rooms = await roomDb.getAll();

    const response = ResponseHelper.success(
      rooms,
      "Lấy danh sách phòng thành công"
    );
    res.status(200).json(response);
  }
);

// READ - Lấy room theo ID
export const getRoomById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const room = await roomDb.getById(id);

    if (!room) {
      return next(new AppError("Không tìm thấy phòng", 404));
    }

    const response = ResponseHelper.success(
      room,
      "Lấy thông tin phòng thành công"
    );
    res.status(200).json(response);
  }
);

// READ - Lấy rooms theo hotel ID
export const getRoomsByHotelId = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { hotelId } = req.params;

    const rooms = await roomDb.getByHotelId(hotelId);

    const response = ResponseHelper.success(
      rooms,
      "Lấy danh sách phòng theo khách sạn thành công"
    );
    res.status(200).json(response);
  }
);

// READ - Lấy rooms có sẵn
export const getAvailableRooms = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { hotelId } = req.query;

    const rooms = await roomDb.getAvailableRooms(hotelId as string);

    const response = ResponseHelper.success(
      rooms,
      "Lấy danh sách phòng có sẵn thành công"
    );
    res.status(200).json(response);
  }
);

// UPDATE - Cập nhật room
export const updateRoom = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData: UpdateRoomRequest = req.body;

    const room = await roomDb.updateById(id, updateData);

    if (!room) {
      return next(new AppError("Không tìm thấy phòng", 404));
    }

    const response = ResponseHelper.success(room, "Cập nhật phòng thành công");
    res.status(200).json(response);
  }
);

// UPDATE - Cập nhật status room
export const updateRoomStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return next(new AppError("Status phải là boolean", 400));
    }

    const room = await roomDb.updateStatus(id, status);

    if (!room) {
      return next(new AppError("Không tìm thấy phòng", 404));
    }

    const response = ResponseHelper.success(
      room,
      "Cập nhật trạng thái phòng thành công"
    );
    res.status(200).json(response);
  }
);

// DELETE - Xóa room (soft delete)
export const deleteRoom = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const room = await roomDb.softDelete(id);

    if (!room) {
      return next(new AppError("Không tìm thấy phòng", 404));
    }

    const response = ResponseHelper.success(room, "Xóa phòng thành công");
    res.status(200).json(response);
  }
);

// DELETE - Xóa room hoàn toàn
export const hardDeleteRoom = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const room = await roomDb.hardDelete(id);

    if (!room) {
      return next(new AppError("Không tìm thấy phòng", 404));
    }

    const response = ResponseHelper.success(
      null,
      "Xóa phòng hoàn toàn thành công"
    );
    res.status(200).json(response);
  }
);

// UTILITY - Lấy thống kê rooms
export const getRoomStats = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { hotelId } = req.query;

    const totalRooms = await roomDb.countRooms(hotelId as string);
    const availableRooms = await roomDb.countAvailableRooms(hotelId as string);

    const stats = {
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
      occupancyRate:
        totalRooms > 0
          ? (((totalRooms - availableRooms) / totalRooms) * 100).toFixed(2)
          : 0,
    };

    const response = ResponseHelper.success(
      stats,
      "Lấy thống kê phòng thành công"
    );
    res.status(200).json(response);
  }
);
