import { IRoom, IRoomDocument, RoomModel } from "@/models/Room";
import { UpdatePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import { RoomResponse } from "@/types/response/roomResponse";

export async function getRoomById(id: string) {
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
  return await roomData.save();
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
