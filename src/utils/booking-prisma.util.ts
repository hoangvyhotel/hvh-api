import { PricingHistoryType } from "@/types/response/booking";
import { PrismaClient } from "@/generated/prisma";
import { AppError } from "./AppError";
const prisma = new PrismaClient();

export const calculateAndUpdatePricing = async (
  bookingPricingId: number,
  historyId: number,
  roomId: number
) => {
  // 1. Lấy bookingPricing từ DB, kèm history
  const bookingPricing = await prisma.bookingPricing.findUnique({
    where: { id: bookingPricingId },
    include: { history: true },
  });


  if (!bookingPricing) {
    throw new Error("BookingPricing not found");
  }

  // 2. Tìm history record cụ thể
  const historyRecord = bookingPricing.history.find((h) => h.id === historyId);

  if (!historyRecord) {
    throw new Error("History record not found");
  }

  // 3. Chuẩn hoá dữ liệu sang PricingHistoryType
  const history = {
    action: historyRecord.action,
    priceType: historyRecord.priceType ?? "",
    amount: historyRecord.amount ?? 0,
    appliedFrom: historyRecord.appliedFrom.toISOString(),
    appliedTo: historyRecord.appliedTo?.toISOString(),
    appliedFirstHourPrice: historyRecord.appliedFirstHourPrice,
    appliedNextHourPrice: historyRecord.appliedNextHourPrice,
    appliedDayPrice: historyRecord.appliedDayPrice,
    appliedNightPrice: historyRecord.appliedNightPrice,
  };

  // 4. Tính toán theo priceType
  let result;
  switch (historyRecord.priceType) {
    case "HOUR":
      result = await updateSpecificHourHistory(
        bookingPricingId.toString(),
        historyId.toString(),
        roomId.toString()
      );
      break;

    case "NIGHT":
      result = await cacutaleNightAndUpdate(bookingPricingId, history, roomId);
      break;

    case "DAY":
      result = await cacutaleDayAndUpdate(
        bookingPricingId,
        history,
        roomId.toString()
      );
      break;

    default:
      throw new Error(`Unsupported priceType: ${historyRecord.priceType}`);
  }
  await recalculateBookingPricing(bookingPricing.bookingId);

  return result;
};
async function recalculateBookingPricing(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { note: true, items: true },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const bookingPricing = await prisma.bookingPricing.findFirst({
    where: { bookingId },
    include: { history: true },
    orderBy: { createdAt: "desc" },
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  // --- TÍNH TỔNG LỊCH SỬ ---
  const totalHistory = bookingPricing.history.reduce(
    (sum, h) => sum + (h.amount || 0),
    0
  );

  // --- TÍNH PHỤ THU ---
  const totalSurcharge: number = Array.isArray(booking.surcharge)
    ? (booking.surcharge as any[]).reduce((sum, s) => {
        if (s && typeof s === "object" && "Amount" in s) {
          const amt = (s as any).Amount;
          return sum + (typeof amt === "number" ? amt : 0);
        }
        return sum;
      }, 0)
    : 0;

  // --- TÍNH TIỆN ÍCH ---
  const totalUtility: number = booking.items.reduce(
    (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
    0
  );

  // --- CỘNG TỔNG ---
  let calculated = totalHistory + totalSurcharge + totalUtility;

  // Trừ giảm giá & trả trước
  if (booking.note?.Discount && booking.note.Discount > 0) {
    calculated -= booking.note.Discount;
  }
  if (booking.note?.PayInAdvance && booking.note.PayInAdvance > 0) {
    calculated -= booking.note.PayInAdvance;
  }

  // Nếu có giá thương lượng > 0 thì dùng luôn
  if (booking.note?.NegotiatedPrice && booking.note.NegotiatedPrice > 0) {
    calculated = booking.note.NegotiatedPrice;
  }

  // --- CẬP NHẬT ---
  const updatedBookingPricing = await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: { calculatedAmount: Math.max(0, calculated) }, // tránh âm
  });

  return { booking, bookingPricing: updatedBookingPricing };
}


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
  const roundedHours = Math.ceil(hours);

  if (originalPrice === 0) {
    amount = roundedHours * nextHourPrice;
    return {
      ...historyPricing,
      appliedFirstHourPrice: firstHourPrice,
      appliedNextHourPrice: nextHourPrice,
      amount: amount,
    };
  }
  if (roundedHours <= 1) {
    amount = firstHourPrice; // nếu <= 1h thì tính giá giờ đầu
  } else {
    amount = firstHourPrice + (roundedHours - 1) * nextHourPrice;
  }

  return {
    ...historyPricing,
    appliedFirstHourPrice: firstHourPrice,
    appliedNextHourPrice: nextHourPrice,
    amount: amount,
  };
};

export const cacutaleNightAndUpdate = async (
  bookingPricingId: number,
  history: PricingHistoryType,
  roomId: number
) => {
  const from = new Date(history.appliedFrom);
  const now = history.appliedTo ? new Date(history.appliedTo) : new Date();

  // Xác định mốc 12h trưa kế tiếp
  const noonThreshold = new Date(from);
  noonThreshold.setHours(12, 0, 0, 0);

  if (from.getHours() >= 12) {
    noonThreshold.setDate(noonThreshold.getDate() + 1);
  }
  console.log("Noon Threshold:", noonThreshold);
  // Nếu chưa qua mốc 12h → chỉ tính tiền night
  if (now < noonThreshold) {
    history.amount = history.appliedNightPrice || 0;
    return { closedNight: history };
  }

  // Transaction đảm bảo atomic
  return await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new Error("Room not found");

    const bookingPricing = await tx.bookingPricing.findUnique({
      where: { id: bookingPricingId },
      include: { booking: { include: { note: true } }, history: true },
    });
    if (!bookingPricing) throw new Error("BookingPricing not found");

    const booking = bookingPricing.booking;

    // đóng record NIGHT cuối
    const lastHistory =
      bookingPricing.history[bookingPricing.history.length - 1];
    if (!lastHistory) throw new Error("No history found");

    await tx.pricingHistory.update({
      where: { id: lastHistory.id },
      data: {
        appliedTo: noonThreshold,
        amount: room.nightPrice,
        appliedNightPrice: room.nightPrice,
      },
    });

    let nextHourHistory: {
      action: "CHANGE_TYPE";
      priceType: string;
      amount: number;
      appliedFrom: string; // 🔥 phải là string
      appliedFirstHourPrice: number;
      appliedNextHourPrice: number;
      appliedDayPrice: number;
      appliedNightPrice: number;
      bookingPricingId: number;
    } = {
      action: "CHANGE_TYPE",
      priceType: "HOUR",
      amount: 0,
      appliedFrom: new Date(noonThreshold ).toISOString(),
      appliedFirstHourPrice: 0,
      appliedNextHourPrice: 0,
      appliedDayPrice: 0,
      appliedNightPrice: 0,
      bookingPricingId: bookingPricing.id,
    };

    // tính lại amount bằng cacutaleHour
    const calcHour = cacutaleHour(
      nextHourHistory,
      nextHourHistory.appliedNextHourPrice ?? 0,
      nextHourHistory.appliedNextHourPrice ?? 0
    );
    nextHourHistory.amount = calcHour.amount ?? 0;

    const createdHourHistory = await tx.pricingHistory.create({
      data: nextHourHistory,
    });

    // cập nhật bookingPricing
    await tx.bookingPricing.update({
      where: { id: bookingPricing.id },
      data: {
        priceType: "HOUR",
        startTime: noonThreshold,
        calculatedAmount:
          !booking.note?.NegotiatedPrice || booking.note?.NegotiatedPrice <= 0
            ? bookingPricing.calculatedAmount +
              (calcHour.amount ?? room.originalPrice)
            : bookingPricing.calculatedAmount,
      },
    });

    // cập nhật room
    await tx.room.update({
      where: { id: room.id },
      data: { typeHire: 1 },
    });

    return { closedNight: history, nextHourHistory: createdHourHistory };
  });
};

export const cacutaleDayAndUpdate = async (
  bookingPricingId: number,
  history: PricingHistoryType,
  roomId: string,
  options: { tx?: any } = {}
) => {
  const from = new Date(history.appliedFrom);
  const now = history.appliedTo ? new Date(history.appliedTo) : new Date();

  // Mốc 24 tiếng sau appliedFrom
  const nextDay = new Date(from);
  nextDay.setDate(nextDay.getDate() + 1);

  // ✅ chưa qua 24h => chỉ tính giá day
  if (now < nextDay) {
    history.amount = history.appliedDayPrice || 0;
    return { closedDay: history };
  }

  // ✅ đã qua 24h => cần truy vấn room & bookingPricing để update
  const room = await prisma.room.findUnique({
    where: { id: Number(roomId) },
  });
  if (!room) throw new Error("Room not found");

  const bookingPricing = await prisma.bookingPricing.findUnique({
    where: { id: bookingPricingId },
    include: { history: true, booking: { include: { note: true } } },
  });
  if (!bookingPricing || !bookingPricing.booking) {
    throw new Error("BookingPricing not found");
  }

  // lấy history cuối cùng trong bookingPricing
  const lastHistory = bookingPricing.history[bookingPricing.history.length - 1];
  if (!lastHistory) throw new Error("History not found");

  // update history cuối (đóng Day)
  await prisma.pricingHistory.update({
    where: { id: lastHistory.id },
    data: {
      appliedTo: nextDay,
      amount: room.dayPrice,
      appliedDayPrice: room.dayPrice,
    },
  });

  // tạo record HOUR mới
  let nextHourHistory: PricingHistoryType = {
    action: "CHANGE_TYPE",
    priceType: "HOUR",
    amount: 0, // sẽ tính ngay sau đây
    appliedFrom: nextDay.toISOString(),
    appliedFirstHourPrice: 0,
    appliedNextHourPrice: room.afterHoursPrice,
    appliedDayPrice: 0,
    appliedNightPrice: 0,
  };

  // ✅ Tính tiền bằng cacutaleHour
  nextHourHistory = cacutaleHour(
    nextHourHistory,
    nextHourHistory.appliedNextHourPrice ?? 0,
    nextHourHistory.appliedNextHourPrice ?? 0
  );

  // insert history mới vào DB
  const createdHourHistory = await prisma.pricingHistory.create({
    data: {
      action: nextHourHistory.action,
      priceType: nextHourHistory.priceType,
      amount: nextHourHistory.amount ?? 0,
      appliedFrom: nextHourHistory.appliedFrom,
      appliedTo: nextHourHistory.appliedTo ?? null,
      appliedFirstHourPrice: nextHourHistory.appliedFirstHourPrice ?? 0,
      appliedNextHourPrice: nextHourHistory.appliedNextHourPrice ?? 0,
      appliedDayPrice: nextHourHistory.appliedDayPrice ?? 0,
      appliedNightPrice: nextHourHistory.appliedNightPrice ?? 0,
      bookingPricingId: bookingPricing.id,
    },
  });

  // update BookingPricing main info
  await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: {
      priceType: "HOUR",
      startTime: nextDay,
      calculatedAmount:
        !bookingPricing.booking.note?.NegotiatedPrice ||
        bookingPricing.booking.note?.NegotiatedPrice < 0
          ? (bookingPricing.calculatedAmount || 0) +
            (nextHourHistory.amount ?? room.originalPrice)
          : bookingPricing.calculatedAmount,
    },
  });

  // update room typeHire
  await prisma.room.update({
    where: { id: room.id },
    data: { typeHire: 1 },
  });

  return { closedDay: history, nextHourHistory: createdHourHistory };
};

export const updateSpecificHourHistory = async (
  bookingPricingId: string,
  historyId: string,
  roomId: string,
  options: { tx?: any } = {}
) => {
  // Lấy room
  const room = await prisma.room.findUnique({
    where: { id: Number(roomId) },
  });
  if (!room) throw new Error("Room not found");

  // Lấy bookingPricing + booking + history cụ thể
  const bookingPricing = await prisma.bookingPricing.findUnique({
    where: { id: Number(bookingPricingId) },
    include: {
      booking: { include: { note: true } },
      history: true,
    },
  });

  if (!bookingPricing || !bookingPricing.booking) {
    throw new Error("BookingPricing not found");
  }

  const historyRecord = bookingPricing.history.find(
    (h) => h.id === Number(historyId)
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
  // Lưu lại amount cũ
  const oldAmount = historyRecord.amount || 0;

  // Tính toán amount mới bằng cacutaleHour
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
      bookingPricingId: bookingPricing.id,
    } as PricingHistoryType,
    historyRecord.appliedFirstHourPrice ?? room.originalPrice,
    room.afterHoursPrice
  );
  // Tính chênh lệch
  const amountDifference =
    (updatedHistory.amount ?? room.originalPrice) - oldAmount;

  // Cập nhật history record trong DB
  const updatedHistoryRecord = await prisma.pricingHistory.update({
    where: { id: historyRecord.id },
    data: {
      amount: updatedHistory.amount ?? 0,
      appliedFirstHourPrice: updatedHistory.appliedFirstHourPrice ?? 0,
      appliedNextHourPrice: updatedHistory.appliedNextHourPrice ?? 0,
    },
  });

  // Nếu không có giá deal thì cập nhật calculatedAmount
  let newCalculatedAmount = bookingPricing.calculatedAmount || 0;

  if (
    !bookingPricing.booking.note?.NegotiatedPrice ||
    bookingPricing.booking.note?.NegotiatedPrice < 0
  ) {
    newCalculatedAmount += amountDifference;
    await prisma.bookingPricing.update({
      where: { id: bookingPricing.id },
      data: { calculatedAmount: newCalculatedAmount },
    });
  }

  return {
    updated: true,
    historyRecord: updatedHistoryRecord,
    calculatedAmount: newCalculatedAmount,
    amountDifference,
  };
};
