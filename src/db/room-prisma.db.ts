import { PrismaClient, Room } from "../generated/prisma";
import { UpdatePrice } from "@/types/request/room/UpdateRangePriceRequest.type";
import { UpdateRoomRequest } from "@/types/request/room/UpdateRoomRequest.type";
import { RoomAvailable, RoomResponse } from "@/types/response/roomResponse";
import { AppError } from "@/utils/AppError";

const prisma = new PrismaClient();

export async function findRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id: parseInt(id) },
  });
  return room;
}

export const getRoomsByHotelId = async (
  hotelId: string,
  isGetAll?: boolean
): Promise<RoomResponse[]> => {
  const rooms = await prisma.room.findMany({
    where: {
      hotelId: parseInt(hotelId),
      ...(isGetAll ? {} : { status: true }),
    },
    orderBy: [{ floor: "asc" }, { name: "asc" }],
  });

  return (
    rooms.map((room) => ({
      id: room.id.toString(),
      name: room.name ?? "",
      floor: room.floor,
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
    })) ?? []
  );
};

export async function saveRoom(room: Omit<Room, "id">) {
  const newRoom = await prisma.room.create({ data: room });
  return newRoom;
}

export async function updateRoomById(id: string, roomData: UpdateRoomRequest) {
  const updatedRoom = await prisma.room.update({
    where: { id: parseInt(id) },
    data: {
      name: roomData.name,
      floor: roomData.floor,
      originalPrice: roomData.originalPrice,
      afterHoursPrice: roomData.afterHoursPrice,
      dayPrice: roomData.dayPrice,
      nightPrice: roomData.nightPrice,
      description: roomData.description,
      typeHire: roomData.typeHire,
      status: roomData.status,
      updatedAt: new Date(),
    },
  });
  return updatedRoom;
}

export async function updateRoomStatus(id: string, status: boolean) {
  const updatedRoom = await prisma.room.update({
    where: { id: parseInt(id) },
    data: { status, updatedAt: new Date() },
  });
  return updatedRoom;
}

export async function del(id: string) {
  await prisma.room.delete({
    where: { id: parseInt(id) },
  });
}

export const updateRangePrice = async (
  data: UpdatePrice[],
  fieldName: keyof Room,
  fieldName_original?: keyof Room | null
) => {
  // Prisma không có bulkWrite như Mongo, ta dùng transaction
  return prisma.$transaction(
    data.map((item) =>
      prisma.room.update({
        where: { id: parseInt(item.roomId) },
        data: {
          [fieldName]: item.newPrice,
          ...(fieldName_original && item.newNextHourPrice !== undefined
            ? { [fieldName_original]: item.newNextHourPrice }
            : {}),
        },
      })
    )
  );
};

export const existingRooms = async (ids: string[]) => {
  return prisma.room.findMany({
    where: { id: { in: ids.map((id) => parseInt(id)) } },
    select: { id: true },
  });
};

export const getRoom = async (id: string): Promise<any> => {
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  const room = await prisma.room.findUnique({
    where: { id: parsedId },
  });
  if (!room) {
    throw AppError.notFound("Không tìm thấy phòng");
  }
  return room;
};

export const updateTypeHireRoom = async (roomId: string, typeHire: number) => {
  const result = await prisma.room.update({
    where: { id: parseInt(roomId) },
    data: { typeHire },
  });
  return result;
};

export const getRoomAvailable = async (
  roomId: string,
  hotelId: string
): Promise<RoomAvailable[]> => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        id: { not: parseInt(roomId) },
        hotelId: parseInt(hotelId),
        status: true,
        typeHire: 0,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return rooms.map((r) => ({
      id: r.id.toString(),
      name: r.name,
    }));
  } catch (error) {
    console.error("getRoomAvailable error:", error);
    throw error;
  }
};
