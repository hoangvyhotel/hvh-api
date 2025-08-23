import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { Types } from "mongoose";

import * as roomDb from "@/db/room.db";
import { BodyRequest, ParamsRequest } from "@/types/request";
import { RoomResponseWithHotel } from "@/types/response/roomResponse";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import { AppError } from "@/utils/AppError";
import { UpdateRangePrice } from "@/types/request/room/UpdateRangePriceRequest.type";

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
