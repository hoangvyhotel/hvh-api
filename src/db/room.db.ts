import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { RoomResponse } from "@/types/response/roomResponse";
import { Types } from "mongoose";

// CREATE - Tạo room mới
export async function create(request: CreateRoomRequest) {
  const room = new RoomModel({
    floor: request.floor,
    originalPrice: request.originalPrice,
    afterHoursPrice: request.afterHoursPrice,
    dayPrice: request.dayPrice,
    nightPrice: request.nightPrice,
    description: request.description,
    typeHire: request.typeHire,
    status: request.status ?? true,
    hotelId: request.hotelId,
  });

  return await room.save();
}

// READ - Lấy tất cả rooms
export async function getAll() {
  return await RoomModel.find().sort({ createdAt: -1 });
}

// READ - Lấy room theo ID
export async function getById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid room ID");
  }
  return await RoomModel.findById(id).populate("hotelId");
}

// READ - Lấy rooms theo hotel ID
export async function getByHotelId(hotelId: string) {
  if (!Types.ObjectId.isValid(hotelId)) {
    throw new Error("Invalid hotel ID");
  }
  return await RoomModel.find({ hotelId })
    .populate("hotelId")
    .sort({ floor: 1 });
}

// READ - Lấy rooms có sẵn (status = true)
export async function getAvailableRooms(hotelId?: string) {
  const filter: any = { status: true };
  if (hotelId) {
    if (!Types.ObjectId.isValid(hotelId)) {
      throw new Error("Invalid hotel ID");
    }
    filter.hotelId = hotelId;
  }
  return await RoomModel.find(filter).populate("hotelId").sort({ floor: 1 });
}

// UPDATE - Cập nhật room
export async function updateById(
  id: string,
  updateData: Partial<CreateRoomRequest>
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid room ID");
  }
  return await RoomModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("hotelId");
}

// UPDATE - Cập nhật status room (available/unavailable)
export async function updateStatus(id: string, status: boolean) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid room ID");
  }
  return await RoomModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate("hotelId");
}

// DELETE - Xóa room (soft delete bằng cách set status = false)
export async function softDelete(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid room ID");
  }
  return await RoomModel.findByIdAndUpdate(
    id,
    { status: false },
    { new: true }
  );
}

// DELETE - Xóa room hoàn toàn
export async function hardDelete(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid room ID");
  }
  return await RoomModel.findByIdAndDelete(id);
}

// UTILITY - Đếm số rooms
export async function countRooms(hotelId?: string) {
  const filter = hotelId ? { hotelId } : {};
  return await RoomModel.countDocuments(filter);
}

// UTILITY - Đếm số rooms available
export async function countAvailableRooms(hotelId?: string) {
  const filter: any = { status: true };
  if (hotelId) {
    filter.hotelId = hotelId;
  }
  return await RoomModel.countDocuments(filter);
}
