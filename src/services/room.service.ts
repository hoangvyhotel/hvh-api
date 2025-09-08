import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { Types } from "mongoose";
import * as roomDb from "@/db/room.db";
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

// CREATE - Tạo room mới
export async function create(request: CreateRoomRequest) {
  const newRoom = new RoomModel({
    ...request,
    status: true, // Mặc định phòng được tạo mới là có sẵn
  });

  return roomDb.saveRoom(newRoom);
}

export async function updateRoom(id: string, roomData: UpdateRoomRequest) {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  Object.assign(room, roomData);
  await roomDb.updateRoomById(id, room);
  return getRoomById(id);
}

export async function updateStatus(id: string, status: boolean) {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  await roomDb.updateRoomStatus(id, status);
}

export async function softDeleteRoom(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  room.status = false;
  return roomDb.updateRoomById(id, room);
}

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

  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest(
      "Có lỗi khi tìm kiếm khách sạn tương ứng với phòng"
    );
  }

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

  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest(
      "Có lỗi khi tìm kiếm khách sạn tương ứng với phòng"
    );
  }

  const isGetAllBool = isGetAll === "true";

  const rooms = await roomDb.getRoomsByHotelId(id, isGetAllBool);

  if (!rooms || rooms.length === 0) {
    throw new Error("Không tìm thấy phòng tương ứng với khách sạn này");
  }

  return ResponseHelper.success(
    rooms,
    "Lấy danh sách phòng thành công",
    "FETCH_SUCCESS"
  );
};

export const getRoomById = async (id: string): Promise<RoomResponse> => {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }
  return {
    id: room._id.toString(),
    floor: room.floor,
    name: room.name,
    originalPrice: room.originalPrice,
    afterHoursPrice: room.afterHoursPrice,
    dayPrice: room.dayPrice,
    nightPrice: room.nightPrice,
    description: room.description,
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

  let fieldName = "";
  switch (typePrice) {
    case "hours":
      fieldName = "afterHoursPrice";
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
  await roomDb.updateRangePrice(data, fieldName);
  return ResponseHelper.success(null, "Cập nhật thành công");
};

export const changeRoomToAvailable = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(id);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }
  room.typeHire = 0; // set status to available
  await roomDb.updateRoomById(id, room);
};

export const getHotelIdByRoomId = async (roomId: string): Promise<string> => {
export const getRoomAvailable = async (
  req: QueryRequest<{ roomId: string, hotelId: string }>
): Promise<GetRoomAvailableResponse> => {
  const { roomId, hotelId } = req.query;
  console.log("id", roomId, hotelId)
  if (!Types.ObjectId.isValid(roomId)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  const room = await roomDb.findRoomById(roomId);
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng với ID đã cho");
  }

  return room.hotelId.toString();
  const data = await roomDb.getRoomAvailable(roomId, hotelId) ?? [];
  return ResponseHelper.success(data, "Lấy danh sách phòng có sẵn thành công");
};
