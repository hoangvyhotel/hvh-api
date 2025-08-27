import BookingPricing from "@/models/BookingPricing";
import { BookingPricingData } from "@/services/booking.service";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";

// booking-princing.db.ts
export const createBookingPricing = async (
  data: BookingPricingData,
  session?: any
): Promise<any> => {
  try {
    const { bookingId, priceType, startTime, amount } = data;
    const pricingData: any = {
      bookingId,
      priceType,
      startTime,
      appliedFirstHourPrice: priceType === "HOUR" ? amount : 0,
      appliedNextHourPrice: 0,
      appliedDayPrice: priceType === "DAY" ? amount : 0,
      appliedNightPrice: priceType === "NIGHT" ? amount : 0,
      calculatedAmount: amount,
    };

    const added = await BookingPricing.create([pricingData], { session });
    return added[0];
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết giá:", error);
    throw AppError.internal("Không thể tạo chi tiết giá");
  }
};
export const getBookingPrincing = async (id: string): Promise<any> => {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  const bookinPrincing = await BookingPricing.findById(id).lean();
  if (!bookinPrincing) {
    throw AppError.notFound("Không tìm thấy chi tiết giá");
  }
  return bookinPrincing;
};

export const updateBookingPricing = async (id: string) => {
  
}
