import { BodyRequest, ParamsRequest } from "@/types/request";
import {
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
} from "@/types/response/booking";
import * as bookingDb from "../db/booking.db";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import * as bookingPrincingDb from "../db/booking-princing.db";
import * as roomDb from "../db/room.db";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";
import { RoomModel } from "@/models/Room";
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
