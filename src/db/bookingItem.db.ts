import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

// export const saveBookingItem = async (data: BookingItemRequest) => {
//   const newBookingItem = BookingItem.create(data);
//   return newBookingItem;
// };

// export const saveAllBookingItems = async (data: BookingItemRequest[]) => {
//   const newBookingItems = BookingItem.insertMany(data);
//   return newBookingItems;
// };

export const getBookingItemsByBookingId = async (bookingId: string) => {
  return prisma.bookingItem.findMany({
    where: { bookingId: Number(bookingId) },
    orderBy: { createdAt: "desc" },
  });
};
