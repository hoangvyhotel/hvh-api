import { AppError } from "@/utils/AppError";
import { BookingPricingData } from "@/services/booking.service";
import { UpdateBookingPricingInput } from "@/types/response/bookingPricing";
import { Note } from "@/types/response/booking";
import { $Enums, Prisma, PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

// CREATE
export const createBookingPricing = async (data: BookingPricingData) => {
  const { bookingId, priceType, startTime, amount } = data;

  // Validate
  if (!bookingId || isNaN(Number(bookingId))) {
    throw AppError.badRequest("ID booking không hợp lệ");
  }

  const validPriceTypes = ["HOUR", "DAY", "NIGHT"];
  if (!validPriceTypes.includes(priceType)) {
    throw AppError.badRequest("Loại giá không hợp lệ");
  }

  if (typeof amount !== "number" || amount < 0) {
    throw AppError.badRequest("Số tiền không hợp lệ");
  }

  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    throw AppError.badRequest("Thời gian bắt đầu không hợp lệ");
  }

  const historyRecord = {
    action: $Enums.PricingAction.CREATE,
    priceType,
    amount,
    description: `Tạo chi tiết giá ${priceType} với số tiền ${amount}`,
    appliedFrom: new Date(),
    appliedFirstHourPrice: priceType === "HOUR" ? amount : 0,
    appliedNextHourPrice: 0,
    appliedDayPrice: priceType === "DAY" ? amount : 0,
    appliedNightPrice: priceType === "NIGHT" ? amount : 0,
  };

  const added = await prisma.bookingPricing.create({
    data: {
      bookingId: Number(bookingId),
      priceType,
      startTime,
      calculatedAmount: amount,
      history: { create: [historyRecord] },
    },
  });

  return added;
};

// READ
export const getBookingPricing = async (id: number) => {
  if (!id || isNaN(id)) {
    throw AppError.badRequest("ID chi tiết giá không hợp lệ");
  }

  const bookingPricing = await prisma.bookingPricing.findUnique({
    where: { id },
  });

  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy chi tiết giá");
  }

  return bookingPricing;
};

// UPDATE
export const updateBookingPricing = async (
  input: UpdateBookingPricingInput
) => {
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

  const bookingIdNum = Number(bookingId);
  const roomIdNum = roomId ? Number(roomId) : undefined;

  let bookingPricing = await prisma.bookingPricing.findFirst({
    where: {
      bookingId: bookingIdNum,
      ...(roomIdNum ? { roomId: roomIdNum } : {}),
    },
  });

  const history = {
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

  if (!bookingPricing) {
    bookingPricing = await prisma.bookingPricing.create({
      data: {
        bookingId: bookingIdNum,
        roomId: roomIdNum,
        priceType,
        startTime: appliedFrom || new Date(),
        calculatedAmount: amount,
        history: { create: [history] },
      },
    });
  } else {
    bookingPricing = await prisma.bookingPricing.update({
      where: { id: bookingPricing.id },
      data: {
        priceType,
        calculatedAmount: amount,
        endTime: appliedTo,
        history: {
          create: [history],
        },
      },
      include: {
        history: true,
      },
    });
  }

  return bookingPricing;
};

// DELETE
export const deleteBookingPricing = async (
  bookingId: number
): Promise<void> => {
  if (!bookingId || isNaN(bookingId)) {
    throw AppError.badRequest("ID booking không hợp lệ");
  }

  const bookingPricings = await prisma.bookingPricing.findMany({
    where: { bookingId },
  });

  if (bookingPricings.length === 0) {
    throw AppError.notFound("Không tìm thấy chi tiết giá cho booking này");
  }

  await prisma.bookingPricing.deleteMany({
    where: { bookingId },
  });
};

// NOTE
export const addNote = async (data: Note) => {
  const bookingPricing = await prisma.bookingPricing.findUnique({
    where: { id: Number(data.BookingPricingId) },
  });

  if (!bookingPricing) {
    throw AppError.notFound("Thao tác thất bại!");
  }

  // tuỳ bạn muốn update note vào trường nào
  return bookingPricing;
};
