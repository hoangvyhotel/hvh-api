import { BodyRequest, ParamsRequest } from "@/types/request";
import {
  BookingItemResponse,
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
} from "@/types/response/booking";
import * as bookingDb from "../db/booking.db";
import * as bookingItemDb from "../db/bookingItem.db";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import * as bookingPrincingDb from "../db/booking-princing.db";
import * as roomDb from "../db/room.db";
import * as utilityDb from "../db/utility.db";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";
import { RoomModel } from "@/models/Room";
import { IUtility } from "@/models/Utility";
export interface BookingPricingData {
  bookingId: Types.ObjectId;
  priceType: "HOUR" | "DAY" | "NIGHT";
  startTime: Date;
  amount: number;
}
export const getRoomsByHotel = async (
  req: ParamsRequest<{ id: string }>
): Promise<GetRoomsByHotelResponse> => {
  const result = await bookingDb.getRoomsByHotel(req);
  return ResponseHelper.success(result, "Lấy danh sách phòng thành công");
};

export const addBooking = async (
  req: BodyRequest<{ roomId: string; type: string }>
): Promise<BaseResponse<null>> => {
  const session = await RoomModel.startSession();
  session.startTransaction();

  try {
    const { roomId, type } = req.body;
    console.log(req.body);
    if (!Types.ObjectId.isValid(roomId)) {
      throw AppError.badRequest("ID phòng không hợp lệ");
    }
    if (!["HOUR", "DAY", "NIGHT"].includes(type)) {
      throw AppError.badRequest("Loại booking không hợp lệ");
    }

    const room = await roomDb.getRoom(roomId);
    if (room.typeHire !== 0) {
      throw AppError.conflict("Phòng đang được booking");
    }

    const pricingMap: Record<string, { amount: number; typeHire: number }> = {
      HOUR: { amount: room.originalPrice, typeHire: 1 },
      DAY: { amount: room.dayPrice, typeHire: 3 },
      NIGHT: { amount: room.nightPrice, typeHire: 2 },
    };

    const { amount, typeHire } = pricingMap[type];

    const bookingAdded = await bookingDb.AddBooking(roomId, session);

    await bookingPrincingDb.createBookingPricing(
      {
        bookingId: bookingAdded._id,
        priceType: type as "HOUR" | "DAY" | "NIGHT",
        startTime: bookingAdded.createdAt!,
        amount,
      },
      session
    );

    await roomDb.updateTypeHireRoom(roomId, typeHire, session);

    await session.commitTransaction();
    return ResponseHelper.success(null, "Tạo booking thành công");
  } catch (error) {
    await session.abortTransaction();
    throw error instanceof AppError
      ? error
      : AppError.internal("Lỗi khi tạo booking");
  } finally {
    session.endSession();
  }
};

export const changeTypeBooking = async (
  req: BodyRequest<{
    bookingPincingId: string;
    currentType: string;
    newType: string;
  }>
) => {
  const { bookingPincingId, currentType, newType } = req.body;
  const existingBookingPricing = await bookingPrincingDb.getBookingPrincing(
    bookingPincingId
  );
  const now = new Date();

  let calculatedAmountCurrent = 0;
  if (currentType === "HOUR") {
    const hoursUsed = Math.ceil(
      (now.getTime() - existingBookingPricing.startTime.getTime()) /
        (1000 * 60 * 60)
    );
    calculatedAmountCurrent =
      existingBookingPricing.appliedFirstHourPrice +
      (hoursUsed - 1) * existingBookingPricing.appliedNextHourPrice;
  } else if (currentType === "NIGHT") {
    const nightsUsed = Math.ceil(
      (now.getTime() - existingBookingPricing.startTime.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    calculatedAmountCurrent =
      nightsUsed * existingBookingPricing.appliedNightPrice;
  } else if (currentType === "DAY") {
    const daysUsed = Math.ceil(
      (now.getTime() - existingBookingPricing.startTime.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    calculatedAmountCurrent = daysUsed * existingBookingPricing.appliedDayPrice;
  }
};

export const getBookingInfo = async (
  req: ParamsRequest<{ roomId: string }>
): Promise<GetBookingInFoResponse> => {
  const bookingInfo = await bookingDb.getBookingInfo(req);
  return ResponseHelper.success(
    bookingInfo,
    "Lấy thông tin đặt phòng thành công"
  );
};

export const getBookings = async (): Promise<any> => {
  const bookings = await bookingDb.getBookings();
  return ResponseHelper.success(bookings, "Lấy danh sách booking thành công");
};

// Implementation hoàn chỉnh cho getRentalBookings
export const getRentalBookings = async (): Promise<any> => {
  const bookings = await bookingDb.getBookings();

  // Sử dụng Promise.all để xử lý tất cả bookings song song
  const bookingItems: BookingItemResponse[] = await Promise.all(
    bookings.map(async (booking) => {
      const room = booking.roomId as any; // Cast to 'any' to access room properties
      console.log("room", room);
      // if (!room) {
      //   throw new Error("Không tìm thấy thông tin phòng cho booking này");
      // }
      const checkin = booking.checkin;

      // Tính utilities price từ booking items với async/await
      let utilitiesPrice = 0;

      if (booking.items && booking.items.length > 0) {
        // Xử lý tất cả utilities song song
        const utilitiesPromises = booking.items.map(async (item) => {
          try {
            const utility = await utilityDb.getUtilityById(
              item.utilitiesId.toString()
            );
            if (utility && utility.price && item.quantity) {
              return utility.price * item.quantity;
            }
            return 0;
          } catch (error) {
            console.error("Lỗi khi lấy utility:", error);
            return 0;
          }
        });

        const utilitiesPrices = await Promise.all(utilitiesPromises);
        utilitiesPrice = utilitiesPrices.reduce(
          (total, price) => total + price,
          0
        );
      }

      console.log("utilitiesPrice", utilitiesPrice);

      const roomPrice = room?.price || 0; // Lấy room price từ room info
      const isCheckout = !!booking.checkout;

      return {
        roomName: room ? room.name : "Tên phòng không xác định",
        checkin,
        checkout: booking.checkout,
        utilitiesPrice,
        roomPrice,
        isCheckout,
      };
    })
  );

  return ResponseHelper.success(
    bookingItems,
    "Lấy danh sách booking thành công"
  );
};
