import { IRoom, IRoomDocument, RoomModel } from "@/models/Room";
import { RoomResponse } from "@/types/response/roomResponse";

export async function getRoomById(id: string) {
  const room = await RoomModel.findById(id);
  return room;
}

export const getRoomsByHotelId = async (
  hotelId: string
): Promise<RoomResponse[]> => {
  const rooms = await RoomModel.find({ hotelId }).exec();

  return rooms.map((room) => ({
    id: room._id.toString(),
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
  return await roomData.save();
}
