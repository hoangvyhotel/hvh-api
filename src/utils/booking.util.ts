import { findRoomById } from "@/db/room.db";
import Booking from "@/models/Booking";
import BookingPricing, { PricingHistory } from "@/models/BookingPricing";
import { PricingHistoryType } from "@/types/response/booking";

export const calculateAndUpdatePricing = async (
  bookingPricingId: string,
  historyId: string,
  roomId: string
) => {
  const bookingPricing = await BookingPricing.findById(bookingPricingId);
  if (!bookingPricing) throw new Error("BookingPricing not found");

  // Tìm history record cụ thể bằng _id
  const historyRecord = bookingPricing.history.find(
    (h) => h._id?.toString() === historyId
  );

  if (!historyRecord) {
    throw new Error("History record not found");
  }

  // Convert history record to PricingHistoryType
  const history: PricingHistoryType = {
    action: historyRecord.action,
    priceType: historyRecord.priceType,
    amount: historyRecord.amount,
    appliedFrom: historyRecord.appliedFrom.toISOString(),
    appliedTo: historyRecord.appliedTo?.toISOString(),
    appliedFirstHourPrice: historyRecord.appliedFirstHourPrice,
    appliedNextHourPrice: historyRecord.appliedNextHourPrice,
    appliedDayPrice: historyRecord.appliedDayPrice,
    appliedNightPrice: historyRecord.appliedNightPrice,
  };

  let result;

  // Gọi hàm tương ứng dựa trên priceType
  switch (historyRecord.priceType) {
    case "HOUR":
      result = await updateSpecificHourHistory(
        bookingPricingId,
        historyId,
        roomId
      );
      break;

    case "NIGHT":
      result = await cacutaleNightAndUpdate(bookingPricingId, history, roomId);
      break;

    case "DAY":
      result = await cacutaleDayAndUpdate(bookingPricingId, history, roomId);
      break;

    default:
      throw new Error(`Unsupported priceType: ${historyRecord.priceType}`);
  }

  return result;
};
const cacutaleTime = (appliedFrom: string, appliedTo?: string): number => {
  if (!appliedFrom) return 0;

  const from = new Date(appliedFrom);
  const to = appliedTo ? new Date(appliedTo) : new Date();

  const diffMs = to.getTime() - from.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 0 ? diffHours : 0;
};

export const cacutaleHour = (
  historyPricing: PricingHistoryType,
  originalPrice: number,
  afterHoursPrice: number
): PricingHistoryType => {
  const hours = cacutaleTime(
    historyPricing.appliedFrom,
    historyPricing.appliedTo
  );

  if (hours <= 0) {
    return { ...historyPricing, amount: 0 };
  }

  const firstHourPrice = originalPrice;
  const nextHourPrice = afterHoursPrice;
  let amount = firstHourPrice;

  if (hours > 1) {
    // số giờ vượt quá giờ đầu
    const extraHours = hours - 1;

    // làm tròn xuống theo block 0.2 giờ
    const roundedExtraHours = Math.floor(extraHours / 0.2) * 0.2;

    // tính tiền các giờ sau
    amount += roundedExtraHours * nextHourPrice;
  }

  return {
    ...historyPricing,
    appliedFirstHourPrice: firstHourPrice,
    appliedNextHourPrice: nextHourPrice,
    amount: amount,
  };
};

export const cacutaleNightAndUpdate = async (
  bookingPricingId: string,
  history: PricingHistoryType,
  roomId: string
) => {
  const from = new Date(history.appliedFrom);
  const now = history.appliedTo ? new Date(history.appliedTo) : new Date();

  // mốc 12h trưa ngày hôm sau
  const noonNextDay = new Date(from);
  noonNextDay.setDate(noonNextDay.getDate() + 1);
  noonNextDay.setHours(12, 0, 0, 0);

  if (now < noonNextDay) {
    history.amount = history.appliedNightPrice || 0;
    return { closedNight: history };
  }

  const room = await findRoomById(roomId);
  if (!room) throw new Error("Room not found");

  const bookingPricing = await BookingPricing.findById(bookingPricingId);
  const booking = await Booking.findById(bookingPricing?.bookingId);
  if (!bookingPricing || !booking) throw new Error("BookingPricing not found");

  // đóng record Night
  const lastHistory = bookingPricing.history[bookingPricing.history.length - 1];
  lastHistory.appliedTo = noonNextDay;
  lastHistory.amount = room.nightPrice;
  lastHistory.appliedNightPrice = room.nightPrice;

  // tạo record HOUR mới
  let nextHourHistory: PricingHistoryType = {
    action: "CHANGE_TYPE",
    priceType: "HOUR",
    amount: 0, // sẽ update ngay bằng cacutaleHour
    appliedFrom: noonNextDay.toISOString(),
    appliedFirstHourPrice: room.originalPrice,
  };

  nextHourHistory = cacutaleHour(
    nextHourHistory,
    room.originalPrice,
    room.afterHoursPrice
  );

  bookingPricing.history.push(nextHourHistory as any);

  bookingPricing.priceType = "HOUR";
  bookingPricing.startTime = noonNextDay;

  if (!booking.note?.NegotiatedPrice || booking.note?.NegotiatedPrice <= 0) {
    bookingPricing.calculatedAmount =
      (bookingPricing.calculatedAmount || 0) +
      (nextHourHistory.amount ?? room.originalPrice);
  }
  room.typeHire = 1;
  await room.save();
  await bookingPricing.save();

  return { closedNight: history, nextHourHistory };
};

export const cacutaleDayAndUpdate = async (
  bookingPricingId: string,
  history: PricingHistoryType,
  roomId: string
) => {
  const from = new Date(history.appliedFrom);
  const now = history.appliedTo ? new Date(history.appliedTo) : new Date();

  // mốc 24 tiếng sau appliedFrom
  const nextDay = new Date(from);
  nextDay.setDate(nextDay.getDate() + 1); // cộng 1 ngày
  // giữ nguyên giờ/phút/giây (không reset về 12h như night)

  if (now < nextDay) {
    // ✅ chưa qua 24h => chỉ tính giá day
    history.amount = history.appliedDayPrice || 0;
    return { closedDay: history };
  }

  // ✅ đã qua 24h => cần truy vấn room & bookingPricing để update
  const room = await findRoomById(roomId);
  if (!room) throw new Error("Room not found");

  const bookingPricing = await BookingPricing.findById(bookingPricingId);
  const booking = await Booking.findById(bookingPricing?.bookingId);

  if (!bookingPricing || !booking) throw new Error("BookingPricing not found");

  const lastHistory = bookingPricing.history[bookingPricing.history.length - 1];
  lastHistory.appliedTo = nextDay;
  lastHistory.amount = room.dayPrice;
  lastHistory.appliedNightPrice = room.dayPrice;

  // tạo record HOUR mới (Amount ban đầu = 0, sẽ tính dần bằng cacutaleHour)
  let nextHourHistory: PricingHistoryType = {
    action: "CHANGE_TYPE",
    priceType: "HOUR",
    amount: 0, // tạm thời, sẽ update bằng cacutaleHour
    appliedFrom: nextDay.toISOString(),
    appliedFirstHourPrice: room.originalPrice,
  };

  // ✅ Tính tiền ngay bằng cacutaleHour
  nextHourHistory = cacutaleHour(
    nextHourHistory,
    room.originalPrice,
    room.afterHoursPrice
  );

  bookingPricing.history.push(nextHourHistory as any);

  // cập nhật BookingPricing main info
  bookingPricing.priceType = "HOUR";
  bookingPricing.startTime = nextDay;
  if (!booking.note?.NegotiatedPrice || booking.note?.NegotiatedPrice < 0) {
    bookingPricing.calculatedAmount =
      (bookingPricing.calculatedAmount || 0) +
      (nextHourHistory.amount ?? room.originalPrice);
  }
  room.typeHire = 1;
  await room.save();
  await bookingPricing.save();

  return { closedDay: history, nextHourHistory };
};

export const updateSpecificHourHistory = async (
  bookingPricingId: string,
  historyId: string,
  roomId: string
) => {
  const room = await findRoomById(roomId);
  if (!room) throw new Error("Room not found");

  const bookingPricing = await BookingPricing.findById(bookingPricingId);
  const booking = await Booking.findById(bookingPricing?.bookingId);

  if (!bookingPricing || !booking) throw new Error("BookingPricing not found");

  // Tìm history record cụ thể bằng _id sử dụng find()
  const historyRecord = bookingPricing.history.find(
    (h) => h._id?.toString() === historyId
  );

  if (!historyRecord) {
    throw new Error("History record not found");
  }

  // Chỉ xử lý nếu PriceType là HOUR
  if (historyRecord.priceType !== "HOUR") {
    return {
      updated: false,
      message: "Not HOUR pricing type",
      historyRecord,
    };
  }

  // Lưu lại amount cũ để tính toán chênh lệch
  const oldAmount = historyRecord.amount || 0;
  // Tính toán amount mới
  const updatedHistory = cacutaleHour(
    {
      action: historyRecord.action,
      priceType: historyRecord.priceType,
      amount: historyRecord.amount,
      appliedFrom: historyRecord.appliedFrom.toISOString(),
      appliedTo: historyRecord.appliedTo?.toISOString(),
      appliedFirstHourPrice: historyRecord.appliedFirstHourPrice,
      appliedNextHourPrice: historyRecord.appliedNextHourPrice,
      appliedDayPrice: historyRecord.appliedDayPrice,
      appliedNightPrice: historyRecord.appliedNightPrice,
    },
    room.originalPrice,
    room.afterHoursPrice
  );

  // Tính chênh lệch a = amount_mới - amount_cũ
  const amountDifference =
    (updatedHistory.amount ?? room.originalPrice) - oldAmount;

  // Cập nhật history record với amount mới
  historyRecord.amount = updatedHistory.amount;
  historyRecord.appliedFirstHourPrice = updatedHistory.appliedFirstHourPrice;
  historyRecord.appliedNextHourPrice = updatedHistory.appliedNextHourPrice;
  if (!booking.note?.NegotiatedPrice || booking.note?.NegotiatedPrice < 0) {
    // Cập nhật calculatedAmount: cộng dồn chênh lệch
    bookingPricing.calculatedAmount =
      (bookingPricing.calculatedAmount || 0) + amountDifference;
  }

  await bookingPricing.save();

  return {
    updated: true,
    historyRecord,
    calculatedAmount: bookingPricing.calculatedAmount,
    amountDifference,
  };
};
