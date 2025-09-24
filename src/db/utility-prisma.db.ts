import { AppError } from "@/utils/AppError";
import { PrismaClient } from "../generated/prisma";
import { CreateUtilityInput } from "../types/request/utility/utility";
const prisma = new PrismaClient();

export async function findUtilities(filter: {
  hotelId: number;
  status?: boolean;
}) {
  return prisma.utility.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
  });
}

export async function createUtility(payload: CreateUtilityInput) {
  if (!payload.hotelId) {
    throw AppError.badRequest("hotelId là bắt buộc");
  }

  // Chuyển hotelId sang number nếu là string
  const hotelIdNumber =
    typeof payload.hotelId === "string"
      ? parseInt(payload.hotelId, 10)
      : payload.hotelId;

  if (typeof hotelIdNumber !== "number" || isNaN(hotelIdNumber)) {
    throw AppError.badRequest("hotelId không hợp lệ");
  }

  return prisma.utility.create({
    data: {
      name: payload.name,
      price: payload.price,
      icon: payload.icon,
      status: payload.status ?? true,
      hotelId: hotelIdNumber,
    },
  });
}

export async function getUtilityById(id: number) {
  return prisma.utility.findUnique({
    where: { id },
  });
}

export async function updateUtilityById(
  id: number,
  payload: Partial<CreateUtilityInput>
) {
  if (!payload) throw AppError.badRequest("Payload không hợp lệ");

  // Chuẩn hóa hotelId sang number
  let hotelIdNumber: number | undefined = undefined;
  if (payload.hotelId !== undefined) {
    if (typeof payload.hotelId === "number") {
      hotelIdNumber = payload.hotelId;
    } else if (typeof payload.hotelId === "string") {
      hotelIdNumber = parseInt(payload.hotelId, 10);
      if (isNaN(hotelIdNumber)) {
        throw AppError.badRequest("hotelId không hợp lệ");
      }
    } else {
      throw AppError.badRequest("hotelId phải là number hoặc string hợp lệ");
    }
  }

  return prisma.utility.update({
    where: { id },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.price !== undefined && { price: payload.price }),
      ...(payload.icon !== undefined && { icon: payload.icon }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(hotelIdNumber !== undefined && { hotelId: hotelIdNumber }),
    },
  });
}

export async function deleteUtilityById(id: number) {
  return prisma.utility.delete({
    where: { id },
  });
}
