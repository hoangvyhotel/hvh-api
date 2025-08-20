import { RoomModel } from "@/models/Room";
import { CreateRoomRequest } from "@/types/request/room/CreateRoomRequest.type";
import { Types } from "mongoose";

import * as roomDb from "@/db/room.db";

// CREATE - Tạo room mới
export async function create(request: CreateRoomRequest) {
  const newRoom = new RoomModel({
    ...request,
    status: true, // Mặc định phòng được tạo mới là có sẵn
  });

  roomDb.saveRoom(newRoom);
}
