import BookingPricing, {
  IBookingPricing,
  PricingHistory,
} from "@/models/BookingPricing";
import { BookingPricingData } from "@/services/booking.service";
import { Note, Surcharge } from "@/types/response/booking";
import { UpdateBookingPricingInput } from "@/types/response/bookingPricing";
import { AppError } from "@/utils/AppError";
import mongoose, { Schema, Types } from "mongoose";

// booking-princing.db.ts
export const createBookingPricing = async (
  data: BookingPricingData,
  session?: any
): Promise<any> => {
  try {
    const { bookingId, priceType, startTime, amount } = data;

    // Kiểm tra bookingId hợp lệ
    if (!Types.ObjectId.isValid(bookingId)) {
      throw AppError.badRequest("ID booking không hợp lệ");
    }

    // Kiểm tra priceType hợp lệ
    const validPriceTypes = ["HOUR", "DAY", "NIGHT"];
    if (!validPriceTypes.includes(priceType)) {
      throw AppError.badRequest("Loại giá không hợp lệ");
    }

    // Kiểm tra amount
    if (typeof amount !== "number" || amount < 0) {
      throw AppError.badRequest("Số tiền không hợp lệ");
    }

    // Kiểm tra startTime
    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
      throw AppError.badRequest("Thời gian bắt đầu không hợp lệ");
    }

    // Tạo bản ghi lịch sử cho hành động CREATE
    const historyRecord: PricingHistory = {
      action: "CREATE",
      priceType,
      amount,
      description: `Tạo chi tiết giá ${priceType} với số tiền ${amount}`,
      appliedFrom: new Date(),
      appliedFirstHourPrice: priceType === "HOUR" ? amount : 0,
      appliedNextHourPrice: 0,
      appliedDayPrice: priceType === "DAY" ? amount : 0,
      appliedNightPrice: priceType === "NIGHT" ? amount : 0,
    };

    // Tạo dữ liệu BookingPricing
    const pricingData: Partial<IBookingPricing> = {
      bookingId: new Types.ObjectId(bookingId),
      priceType,
      startTime,
      calculatedAmount: amount,
      history: [historyRecord],
    };

    // Tạo bản ghi trong cơ sở dữ liệu
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

export const updateBookingPricing = async (
  input: UpdateBookingPricingInput
): Promise<IBookingPricing> => {
  const {
    bookingId,
    roomId,
    priceType,
    action,
    amount,
    description,
    appliedFrom,
    appliedTo,
    appliedFirstHourPrice = 0,
    appliedNextHourPrice = 0,
    appliedDayPrice = 0,
    appliedNightPrice = 0,
  } = input;

  const bookingObjectId = new Types.ObjectId(bookingId);
  const roomObjectId = roomId ? new Types.ObjectId(roomId) : undefined;

  // tìm BookingPricing theo bookingId + roomId
  let bookingPricing = await BookingPricing.findOne({
    bookingId: bookingObjectId,
    ...(roomObjectId ? { roomId: roomObjectId } : {}),
  });

  // nếu chưa có thì tạo mới
  if (!bookingPricing) {
    bookingPricing = new BookingPricing({
      bookingId: bookingObjectId,
      roomId: roomObjectId,
      priceType,
      startTime: appliedFrom || new Date(),
      calculatedAmount: amount,
      history: [],
    });
  }

  // tạo record history
  const history: PricingHistory = {
    action,
    priceType,
    amount,
    description,
    appliedFrom: appliedFrom || new Date(),
    appliedTo,
    appliedFirstHourPrice,
    appliedNextHourPrice,
    appliedDayPrice,
    appliedNightPrice,
  };

  // push history vào mảng
  bookingPricing.history.push(history);

  // cập nhật các field chính
  bookingPricing.priceType = priceType;
  bookingPricing.calculatedAmount = amount;
  if (appliedTo) bookingPricing.endTime = appliedTo;

  // lưu lại
  await bookingPricing.save();

  return bookingPricing;
};

export const addNote = async (data: Note) => {
  const bookingPricing = await BookingPricing.findById(
    data.BookingPricingId
  );
  if (!bookingPricing) {
    throw AppError.notFound("Thao tác thất bại!");
  }
};
