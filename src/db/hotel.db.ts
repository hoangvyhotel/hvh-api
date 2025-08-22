import { HotelModel } from "@/models/Hotel";

export const findHotelById = async (id: string) => {
  const hotel = HotelModel.findById(id);
  return hotel;
};
