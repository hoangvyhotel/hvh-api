import * as hotelDb from "@/db/hotel.db";
import { AppError } from "@/utils/AppError";

export const existingHotel = async (id: string) => {
  const hotel = await hotelDb.findHotelById(id);
  if (!hotel) {
    throw AppError.notFound("Khách sạn không tồn tại");
  }
  return hotel;
};
