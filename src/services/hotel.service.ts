import  * as hotelDatabase  from "@/db/hotel-prisma.db";
import { AppError } from "@/utils/AppError";

export const existingHotel = async (id: string) => {
  const hotelId = parseInt(id);
  if (isNaN(hotelId)) {
    throw AppError.badRequest("ID hotel không hợp lệ");
  }

  const hotel = await hotelDatabase.findHotelById(id);
  if (!hotel) {
    throw AppError.notFound("Khách sạn không tồn tại");
  }
  return hotel;
};
