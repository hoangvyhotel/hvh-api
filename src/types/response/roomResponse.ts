import { getRoomAvailable } from "@/services/room.service";
import { BaseResponse } from "./base";

export interface RoomResponse {
  id: string; // Room ID
  name: string;
  floor: number;
  originalPrice: number;
  afterHoursPrice: number;
  dayPrice: number;
  nightPrice: number;
  description: string;
  typeHire: number; // Assuming this is an enum or a specific set of values
  status: boolean; // true for available, false for not available
  hotelId: string; // Reference to the Hotel model, should be a valid ObjectId string
  createdAt: Date; // Timestamp of when the room was created
  updatedAt: Date; // Timestamp of when the room was last updated
}

export interface RoomAvailable {
  id: string;
  name: string;
}

export type RoomResponseWithHotel = BaseResponse<RoomResponse[]>;
export type GetRoomAvailableResponse = BaseResponse<RoomAvailable[]>;
