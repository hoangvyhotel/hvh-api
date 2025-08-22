import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { Types } from "mongoose";

import * as roomDb from "@/db/room.db";
import { ParamsRequest } from "@/types/request";
import { RoomResponseWithHotel } from "@/types/response/roomResponse";
import { ResponseHelper } from "@/utils/response";

// CREATE - Tạo room mới
export async function create(request: CreateRoomRequest) {
  const newRoom = new RoomModel({
    ...request,
    status: true, // Mặc định phòng được tạo mới là có sẵn
  });

  roomDb.saveRoom(newRoom);
}

export const getAllRooms = async (
  req: ParamsRequest<{ id: string }>
): Promise<RoomResponseWithHotel> => {
  const hotelId = req.params.id;

  if (!Types.ObjectId.isValid(hotelId)) {
    throw new Error("Có lỗi khi tìm kiếm khách sạn tương ứng với phòng");
  }

  const rooms = await roomDb.getRoomsByHotelId(hotelId);

  if (!rooms || rooms.length === 0) {
    throw new Error("Không tìm thấy phòng tương ứng với khách sạn này");
  }

  return ResponseHelper.success(
    rooms,
    "Lấy danh sách phòng thành công",
    "FETCH_SUCCESS"
  );
};

