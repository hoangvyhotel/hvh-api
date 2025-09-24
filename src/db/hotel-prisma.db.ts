import { PrismaClient } from "../generated/prisma"; // Adjust the import path based on your Prisma client location

const prisma = new PrismaClient();

export const findHotelById = async (id: string) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: parseInt(id) },
  });
  return hotel;
};