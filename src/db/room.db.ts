import { IRoom, IRoomDocument, RoomModel } from "@/models/Room";
import { UpdatePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import { RoomResponse } from "@/types/response/roomResponse";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";

export async function findRoomById(id: string) {
  const room = await RoomModel.findById(id);
  return room;
}

export const getRoomsByHotelId = async (
  hotelId: string,
  isGetAll?: boolean
): Promise<RoomResponse[]> => {
  const query: any = { hotelId };
  if (!isGetAll) {
    query.status = true;
  }

  const rooms = await RoomModel.find(query).exec();

  return rooms.map((room) => ({
    id: room._id.toString(),
    name: room.name ?? "",
    floor: room.floor,
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
  }));
};

export async function saveRoom(room: IRoom): Promise<IRoomDocument> {
  const newRoom = new RoomModel(room);
  return newRoom.save();
}

export async function updateRoomById(id: string, roomData: IRoomDocument) {
  const updatedRoom = await roomData.save();
  return findRoomById(updatedRoom._id.toString());
}

export async function updateRoomStatus(id: string, status: boolean) {
  const updatedRoom = await RoomModel.findByIdAndUpdate(
    id,
    { status, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  return updatedRoom;
}

export async function del(id: string) {
  await RoomModel.findByIdAndDelete(id);
}

export const updateRangePrice = async (
  data: UpdatePrice[],
  fieldName: string
) => {
  const bulkOps = data.map((item) => ({
    updateOne: {
      filter: { _id: item.roomId },
      update: { $set: { [fieldName]: item.newPrice } },
    },
  }));

  const result = await RoomModel.bulkWrite(bulkOps);
  return result;
};

export const existingRooms = async (ids: string[]) => {
  return await RoomModel.find({ _id: { $in: ids } }).select("_id");
};

export const getRoom = async (id: string): Promise<any> => {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  const room = await RoomModel.findById(id).lean();
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng");
  }
  return room;
};

export const updateTypeHireRoom = async (roomId: string, typeHire: number, session?: any) => {
  const result = await RoomModel.updateOne(
    { _id: new Types.ObjectId(roomId) },
    { $set: { typeHire } },
    { session }
  );
  return result;
};

