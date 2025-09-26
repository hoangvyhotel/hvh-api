import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { Types } from "mongoose";
import * as roomDb from "@/db/room-prisma.db";
import { BodyRequest, ParamsRequest, QueryRequest } from "@/types/request";
import {
  GetRoomAvailableResponse,
  RoomResponse,
  RoomResponseWithHotel,
} from "@/types/response/roomResponse";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import { AppError } from "@/utils/AppError";
import { UpdateRangePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import { UpdateRoomRequest } from "@/types/request/room/UpdateRoomRequest.type";
import { PrismaClient } from "../generated/prisma";
import { Room } from "../generated/prisma";
const prisma = new PrismaClient();

// CREATE - Tạo room mới
export async function create(request: CreateRoomRequest) {
  // Prisma không cần new Model như mongoose
  const newRoom = await prisma.room.create({
    data: {
      floor: request.floor,
      name: request.name,
      originalPrice: request.originalPrice,
      afterHoursPrice: request.afterHoursPrice,
      dayPrice: request.dayPrice,
      nightPrice: request.nightPrice,
      description: request.description,
      typeHire: request.typeHire ?? 0, // default nếu không truyền
      status: true, // mặc định phòng có sẵn
      hotelId: Number(request.hotelId),
    },
  });

  return newRoom;
}

export async function updateRoom(id: string, roomData: UpdateRoomRequest) {
  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  await roomDb.updateRoomById(id, roomData);
  return getRoomById(id);
}

export async function updateStatus(id: string, status: boolean) {
  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  await roomDb.updateRoomStatus(id, status);
}

// export async function softDeleteRoom(id: string) {
//   if (!Types.ObjectId.isValid(id)) {
//     throw AppError.badRequest("ID phòng không hợp lệ");
//   }

//   const room = await roomDb.findRoomById(id);
//   if (!room) {
//     throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
//   }

//   room.status = false;
//   return roomDb.updateRoomById(id, room);
// }

export async function hardDeleteRoom(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  await roomDb.del(id);
}

export const getAllRoomsByHotelId = async (
  req: ParamsRequest<{ id: string }>
): Promise<RoomResponseWithHotel> => {
  const { id } = req.params;

  const rooms = await roomDb.getRoomsByHotelId(id);

  if (!rooms || rooms.length === 0) {
    throw new Error("Không tìm thấy phòng tương ứng với khách sạn này");
  }

  return ResponseHelper.success(
    rooms,
    "Lấy danh sách phòng thành công",
    "FETCH_SUCCESS"
  );
};

export const getAllRooms = async (
  req: QueryRequest<{ id: string; isGetAll?: string }>
): Promise<RoomResponseWithHotel> => {
  const { id, isGetAll = "false" } = req.query;

  const isGetAllBool = isGetAll === "true";

  const rooms = await roomDb.getRoomsByHotelId(id, isGetAllBool);

  return ResponseHelper.success(
    rooms,
    "Lấy danh sách phòng thành công",
    "FETCH_SUCCESS"
  );
};

export const getRoomById = async (id: string): Promise<RoomResponse> => {
  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }
  return {
    id: room.id.toString(),
    floor: room.floor,
    name: room.name,
    originalPrice: room.originalPrice,
    afterHoursPrice: room.afterHoursPrice,
    dayPrice: room.dayPrice,
    nightPrice: room.nightPrice,
    description: room.description ?? "",
    typeHire: room.typeHire,
    status: room.status,
    hotelId: room.hotelId.toString(),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
};

export const updateRangePrice = async (
  req: BodyRequest<UpdateRangePrice>
): Promise<BaseResponse<null>> => {
  const { data, typePrice } = req.body;

  let fieldName: keyof Room;
  let fieldName_original: keyof Room | null = null;

  switch (typePrice) {
    case "hours":
      fieldName = "afterHoursPrice";
      fieldName_original = "originalPrice";
      break;
    case "day":
      fieldName = "dayPrice";
      break;
    case "night":
      fieldName = "nightPrice";
      break;
    default:
      throw new Error("Loại giá không hợp lệ");
  }

  const roomIds = data.map((d) => d.roomId);
  const existing = await roomDb.existingRooms(roomIds);
  if (existing.length !== roomIds.length) {
    throw AppError.badRequest("Yêu cầu không hợp lệ!");
  }

  await roomDb.updateRangePrice(data, fieldName, fieldName_original);
  return ResponseHelper.success(null, "Cập nhật thành công");
};

export const getRoomAvailable = async (
  req: QueryRequest<{ roomId: string; hotelId: string }>
): Promise<GetRoomAvailableResponse> => {
  const { roomId, hotelId } = req.query;

  const data = (await roomDb.getRoomAvailable(roomId, hotelId)) ?? [];
  return ResponseHelper.success(data, "Lấy danh sách phòng có sẵn thành công");
};

export const changeRoomToAvailable = async (roomId: string) => {
  const id = parseInt(roomId, 10);

  if (isNaN(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  // Kiểm tra phòng tồn tại
  const room = await prisma.room.findUnique({
    where: { id },
  });
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  // Cập nhật typeHire = 0 (available)
  const updatedRoom = await prisma.room.update({
    where: { id },
    data: { typeHire: 0 },
  });

  return updatedRoom;
};

export const getHotelIdByRoomId = async (roomId: string) => {
  const id = parseInt(roomId, 10);

  if (isNaN(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  const room = await roomDb.findRoomById(roomId);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }
  return room.hotelId.toString();
};
