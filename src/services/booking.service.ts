import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
  QueryRequest,
} from "@/types/request";
import {
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
  Note,
  Surcharge,
} from "@/types/response/booking";
import * as bookingDb from "../db/booking.db";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import * as bookingPrincingDb from "../db/booking-princing.db";
import * as roomDb from "../db/room.db";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";
import { RoomModel } from "@/models/Room";
import { asyncWrapProviders } from "async_hooks";
import BookingPricing from "@/models/BookingPricing";
import Utility from "@/models/Utility";
import Booking from "@/models/Booking";
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
    bookingId: string;
    newPriceType: "HOUR" | "DAY" | "NIGHT";
  }>
): Promise<BaseResponse<null>> => {
  const { bookingId, newPriceType } = req.body;
  await bookingDb.changePriceType(bookingId, newPriceType);
  return ResponseHelper.success(null, "Chuyển kiểu tính tiền thành công");
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

export const AddSurcharge = async (
  req: BodyRequest<Surcharge>
): Promise<BaseResponse<null>> => {
  const data = req.body;
  console.log("data", data);
  if (!data.BookingId && !Types.ObjectId.isValid(data.BookingId!)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  await bookingDb.addSurcharge(data);
  return ResponseHelper.success(null, "Thêm phụ thu thành công");
};

export const AddNote = async (
  req: AuthenticatedRequest<{ id: string }, Note>
): Promise<BaseResponse<null>> => {
  const data = req.body;
  const { id } = req.params;
  if (!id && !Types.ObjectId.isValid(id!)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  await bookingDb.addNote(id, data);
  return ResponseHelper.success(null, "Thêm thành công");
};

// controller
export const AddUtility = async (
  req: BodyRequest<{ utilityId: string; bookingId: string; quantity?: number }>
): Promise<BaseResponse<null>> => {
  const { utilityId, bookingId, quantity = 1 } = req.body;

  if (
    !Types.ObjectId.isValid(bookingId) ||
    !Types.ObjectId.isValid(utilityId)
  ) {
    throw AppError.badRequest("ID không hợp lệ");
  }

  // Lấy thông tin utility (giá, tên)
  const utility = await Utility.findById(utilityId).lean();
  if (!utility) {
    throw AppError.notFound("Không tìm thấy dịch vụ/tiện ích");
  }

  // Thêm utility vào booking + update giá bookingPricing
  await bookingDb.addUtility(bookingId, utility, quantity);

  return ResponseHelper.success(null, "Thêm tiện ích thành công");
};

export const RemoveUtilityService = async (
  req: BodyRequest<{ bookingId: string; utilityId: string; quantity?: number }>
): Promise<BaseResponse<null>> => {
  const { bookingId, utilityId, quantity = 1 } = req.body;
  console.log(req.body);

  if (
    !Types.ObjectId.isValid(bookingId) ||
    !Types.ObjectId.isValid(utilityId)
  ) {
    throw AppError.badRequest("ID không hợp lệ");
  }

  try {
    await bookingDb.removeUtility(bookingId, utilityId, quantity);
    return ResponseHelper.success(null, "Xóa/giảm tiện ích thành công");
  } catch (error: any) {
    throw AppError.internal(error?.message || "Xảy ra lỗi khi xóa tiện ích");
  }
};

export const removeBooking = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<null>> => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID không hợp lệ");
  }
  try {
    await bookingDb.deleteBooking(id);
    return ResponseHelper.success(null, "Hủy phòng thành công");
  } catch (error: any) {
    throw AppError.internal(error?.message || "Xảy ra lỗi khi hủy phòng");
  }
};

export const getNoteByBooking = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<Note | null>> => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID không hợp lệ");
  }
  try {
    const data = await bookingDb.getNote(id);
    return ResponseHelper.success(data, "Lấy ghi chú thành công");
  } catch (error: any) {
    throw AppError.internal(error?.message || "Xảy ra lỗi khi lấy ghi chú");
  }
};

export const moveRoom = async (
  req: BodyRequest<{ bookingId: string; newRoomId: string }>
): Promise<BaseResponse<null>> => {
  const { bookingId, newRoomId } = req.body;
  if (
    !Types.ObjectId.isValid(bookingId) ||
    !Types.ObjectId.isValid(newRoomId)
  ) {
    throw AppError.badRequest("ID không hợp lệ");
  }

  await bookingDb.moveRoom(bookingId, newRoomId);
  return ResponseHelper.success(null, "Đổi phòng thành công");
};
