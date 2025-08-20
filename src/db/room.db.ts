import { IRoom, IRoomDocument, RoomModel } from "@/models/Room";

export async function getRoomById(id: string) {
  const room = await RoomModel.findById(id);
  return room;
}

export async function saveRoom(room: IRoom): Promise<IRoomDocument> {
  const newRoom = new RoomModel(room);
  return newRoom.save();
}

export async function updateRoomById(id: string, roomData: IRoomDocument) {
  return await roomData.save();
}
