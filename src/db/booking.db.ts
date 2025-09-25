import { ParamsRequest } from "@/types/request";
import { TYPE_BOOKINGS } from "@/constant/constant";
import { PrismaClient } from "../generated/prisma";
import { BookingPricing, GetBookingInfo, Note } from "@/types/response/booking";
import { AppError } from "@/utils/AppError";
import { calculateAndUpdatePricing } from "@/utils/booking-prisma.util";
import { $Enums, PricingHistory } from "@/generated/prisma";
const prisma = new PrismaClient();

type UtilitiesForBooking = {
  Quantity: number;
  Icon: string;
};

export interface PricingData {
  id: string;
  priceType: string;
  startTime: Date;
  endTime?: Date;
  room: any; // bạn có thể thay bằng type Room nếu cần
  appliedFirstHourPrice: number;
  appliedNextHourPrice: number;
  appliedDayPrice: number;
  appliedNightPrice: number;
  calculatedAmount: number;
}

export interface GetRoomsByHotel {
  HotelId: string;
  RoomName: string;
  Status: string;
  TypeBooking?:
    | typeof TYPE_BOOKINGS.DAY
    | typeof TYPE_BOOKINGS.HOUR
    | typeof TYPE_BOOKINGS.NIGHT;
  Utilities?: UtilitiesForBooking[];
  Description?: string;
  Floor: number;
  Checkin?: Date;
  RoomId: string;
}

/**
 * Lấy danh sách phòng của khách sạn kèm booking hiện tại
 */
export const getRoomsByHotel = async (
  req: ParamsRequest<{ id: string }>
): Promise<GetRoomsByHotel[]> => {
  const { id } = req.params;

  // 1. Lấy tất cả phòng của khách sạn (status = true)
  const rooms = await prisma.room.findMany({
    where: {
      hotelId: Number(id),
      status: true,
    },
  });

  const roomIds = rooms.map((r: { id: any }) => r.id);

  // 2. Lấy các booking hiện tại (chưa checkout) của các room đó
  const bookings = await prisma.booking.findMany({
    where: {
      roomId: { in: roomIds },
      // giả sử logic: booking chưa checkout
      checkout: null,
    },
    include: {
      items: {
        include: {
          utility: true, // join utility table
        },
      },
    },
  });

  // 3. Map roomId -> booking hiện tại
  const bookingMap: Record<string, (typeof bookings)[number] | undefined> = {};
  bookings.forEach((b) => {
    bookingMap[b.roomId] = b;
  });

  // 4. Build dữ liệu trả về
  return rooms.map(
    (room: {
      id: string | number;
      typeHire: number;
      name: any;
      description: any;
      floor: any;
    }) => {
      const booking = bookingMap[room.id];

      const typeBooking =
        room.typeHire === 1
          ? TYPE_BOOKINGS.HOUR
          : room.typeHire === 2
          ? TYPE_BOOKINGS.NIGHT
          : room.typeHire === 3
          ? TYPE_BOOKINGS.DAY
          : TYPE_BOOKINGS.HOUR;

      return {
        HotelId: id,
        RoomId: room.id.toString(),
        RoomName: room.name,
        Status: booking ? "CHECKIN" : "FREE",
        TypeBooking: typeBooking,
        Utilities: booking
          ? booking.items.map(
              (item: { quantity: any; utility: { icon: any } }) => ({
                Quantity: item.quantity,
                Icon: item.utility?.icon ?? "",
              })
            )
          : undefined,
        Description: room.description ?? undefined,
        Floor: room.floor ?? 0,
        Checkin: booking?.checkin ?? undefined,
      };
    }
  );
};

/**
 * Lấy toàn bộ booking (populate room)
 */
export const getBookings = async () => {
  return prisma.booking.findMany({
    include: {
      room: true,
      items: true,
    },
  });
};

/**
 * Tạo mới 1 booking cho room
 */
export const AddBooking = async (
  roomId: string,
  tx?: Parameters<typeof prisma.$transaction>[0]
) => {
  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: Number(roomId),
        checkin: new Date(),
      },
    });
    return booking;
  } catch (error) {
    console.error("Lỗi khi tạo booking:", error);
    throw AppError.internal("Không thể tạo booking");
  }
};
//sử dụng mongoose

export const getBookingInfo = async (
  req: ParamsRequest<{ roomId: string }>
): Promise<GetBookingInfo> => {
  const { roomId } = req.params;

  const booking = await prisma.booking.findFirst({
    where: { roomId: Number(roomId) },
    include: {
      room: true,
      note: true,
      items: {
        include: { utility: true },
      },
      bookingPricings: {
        include: { history: true },
        orderBy: { createdAt: "desc" },
        take: 1, // chỉ lấy cái mới nhất
      },
    },
  });
  if (!booking) {
    throw new Error("Không tìm thấy booking cho roomId này");
  }

  const bp = booking.bookingPricings[0];
  console.log("Latest bookingPricing:", bp);
  if (bp?.id && bp.history.length > 0) {
    const latestHistory = bp.history[bp.history.length - 1];
    if (latestHistory?.id) {
      try {
        await calculateAndUpdatePricing(
          bp.id,
          latestHistory.id,
          Number(roomId)
        );

        // reload bookingPricings
        const updated = await prisma.bookingPricing.findUnique({
          where: { id: bp.id },
          include: { history: true },
        });
        console.log("Reloaded bookingPricing:", updated);
        if (updated) booking.bookingPricings[0] = updated;
      } catch (error) {
        console.error(
          `Lỗi khi cập nhật giá cho bookingPricingId: ${bp.id}, historyId: ${latestHistory.id}`,
          error
        );
      }
    }
  }

  const calculateHours = (start: Date | null, end?: Date | null): number => {
    if (!start) return 0;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10;
  };

  const totalHours = calculateHours(booking.checkin);

  const totalAmountUtilities = booking.items.reduce(
    (sum: number, it: { quantity?: number; price?: number | null }) => {
      const qty = typeof it.quantity === "number" ? it.quantity : 0;
      const price = typeof it.price === "number" ? it.price : 0;
      return sum + qty * price;
    },
    0
  );
  console.log("TotalAmountUtilities:", totalAmountUtilities);

  return {
    BookingId: booking.id.toString(),
    RoomName: booking.room?.name ?? "Phòng không xác định",
    TypeBooking:
      booking.room?.typeHire === 1
        ? TYPE_BOOKINGS.HOUR
        : booking.room?.typeHire === 2
        ? TYPE_BOOKINGS.NIGHT
        : booking.room?.typeHire === 3
        ? TYPE_BOOKINGS.DAY
        : TYPE_BOOKINGS.HOUR,
    CheckinDate: booking.checkin,
    Times: totalHours,
    TotalAmountUtilities: totalAmountUtilities,
    Utilities: booking.items.map((it) => ({
      _id: it.utility.id,
      Name: it.utility.name,
      Quantity: it.quantity,
      Price: typeof it.price === "number" ? it.price : undefined, // đảm bảo không phải null
      Icon: it.utility?.icon ?? "",
    })),
    Documents: Array.isArray(booking.documentInfo)
      ? (booking.documentInfo as any[]).map((doc) => ({
          ID: doc.ID || "",
          TypeID: doc.TypeID || "CCCD",
          FullName: doc.FullName || "",
          Address: doc.Address || "",
          BirthDay: doc.BirthDay || "",
          Gender: doc.Gender ?? false,
          EthnicGroup: doc.EthnicGroup || "",
        }))
      : [],
    CarInfos: Array.isArray(booking.carInfo)
      ? (booking.carInfo as any[]).map((c) => ({
          LicensePlate: c.LicensePlate || "",
        }))
      : [],
    Surcharge: Array.isArray(booking.surcharge)
      ? (booking.surcharge as any[]).map((s) => ({
          Content: s.Content || "",
          Amount: s.Amount || 0,
        }))
      : [],
    Notes: booking.note
      ? {
          Content: booking.note.Content || "",
          Discount: booking.note.Discount || 0,
          PayInAdvance: booking.note.PayInAdvance || 0,
          NegotiatedPrice: booking.note.NegotiatedPrice || 0,
        }
      : undefined,
    BookingPricing: booking.bookingPricings.map<BookingPricing>((bp) => ({
      PriceType: bp.priceType,
      StartDate: bp.startTime.toISOString(),
      EndDate: bp.endTime?.toISOString(),
      CalculatedAmount: bp.calculatedAmount,
      History: bp.history.map((h) => ({
        action: h.action, // viết thường
        priceType: h.priceType ?? undefined,
        amount: h.amount ?? undefined,
        description: h.description ?? undefined,
        appliedFrom: h.appliedFrom.toISOString(), // convert Date -> string
        appliedTo: h.appliedTo?.toISOString(), // convert Date -> string
        appliedFirstHourPrice: h.appliedFirstHourPrice,
        appliedNextHourPrice: h.appliedNextHourPrice,
        appliedDayPrice: h.appliedDayPrice,
        appliedNightPrice: h.appliedNightPrice,
        Times: calculateHours(h.appliedFrom, h.appliedTo),
      })),
    })),
  };
};

// =================== ADD SURCHARGE ===================
export const addSurcharge = async (surcharge: {
  BookingId: string;
  Content: string;
  Amount: number;
}) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(surcharge.BookingId) },
    include: { note: true, items: true },
  });

  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const bookingPricing = await prisma.bookingPricing.findFirst({
    where: { bookingId: Number(surcharge.BookingId) },
    include: { history: true },
  });

  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  // --- Thêm surcharge mới ---
  const currentSurcharge: { Content: string; Amount: number }[] = Array.isArray(
    booking.surcharge
  )
    ? booking.surcharge.filter(
        (s): s is { Content: string; Amount: number } =>
          s !== null &&
          typeof s === "object" &&
          typeof (s as any).Content === "string" &&
          typeof (s as any).Amount === "number"
      )
    : [];

  const updatedSurcharge = [
    ...currentSurcharge,
    { Content: surcharge.Content, Amount: surcharge.Amount },
  ];

  await prisma.booking.update({
    where: { id: booking.id },
    data: { surcharge: updatedSurcharge },
  });

  // --- Nếu có history thì gọi calculate lại ---
  if (bookingPricing.history.length > 0) {
    const latestHistory =
      bookingPricing.history[bookingPricing.history.length - 1];
    try {
      await calculateAndUpdatePricing(
        bookingPricing.id,
        latestHistory.id,
        booking.roomId
      );
    } catch (error) {
      console.error(
        `Lỗi khi cập nhật giá cho bookingPricingId: ${bookingPricing.id}, historyId: ${latestHistory.id}`,
        error
      );
    }
  }

  // --- TÍNH LẠI GIÁ ---
  const totalHistory = bookingPricing.history.reduce(
    (sum, h) => sum + (h.amount || 0),
    0
  );

  const totalSurcharge = updatedSurcharge.reduce(
    (sum, s) => sum + (s.Amount || 0),
    0
  );

  const totalUtility = booking.items.reduce(
    (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
    0
  );

  let calculated = totalHistory + totalSurcharge + totalUtility;

  if (booking.note?.Discount && booking.note.Discount > 0) {
    calculated -= booking.note.Discount;
  }
  if (booking.note?.PayInAdvance && booking.note.PayInAdvance > 0) {
    calculated -= booking.note.PayInAdvance;
  }

  if (booking.note?.NegotiatedPrice && booking.note.NegotiatedPrice > 0) {
    calculated = booking.note.NegotiatedPrice;
  }

  const updatedBookingPricing = await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: { calculatedAmount: Math.max(0, calculated) },
  });

  return {
    booking: await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { note: true, items: true },
    }),
    bookingPricing: updatedBookingPricing,
  };
};

// =================== ADD NOTE ===================
export const addNote = async (
  bookingId: string,
  note: { Discount?: number; PayInAdvance?: number; NegotiatedPrice?: number }
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { note: true, items: true },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const bookingPricing = await prisma.bookingPricing.findFirst({
    where: { bookingId: Number(bookingId) },
    include: { history: true },
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  // --- Lưu ghi chú ---
  let noteRecord;
  if (booking.note) {
    console.log("Cập nhật note hiện tại:", booking.note.id);
    // update note nếu đã tồn tại
    noteRecord = await prisma.note.update({
      where: { id: booking.note.id },
      data: {
        Discount: note.Discount,
        PayInAdvance: note.PayInAdvance,
        NegotiatedPrice: note.NegotiatedPrice,
        Content: (note as any).Content ?? "",
      },
    });
  } else {
    // tạo note mới
    noteRecord = await prisma.note.create({
      data: {
        ...note,
        booking: {
          connect: { id: Number(bookingId) },
        },
      },
    });
  }

  // --- CẬP NHẬT GIÁ LỊCH SỬ MỚI NHẤT ---
  if (bookingPricing.history.length > 0) {
    const latestHistory =
      bookingPricing.history[bookingPricing.history.length - 1];
    try {
      await calculateAndUpdatePricing(
        bookingPricing.id,
        latestHistory.id,
        booking.roomId
      );
    } catch (error) {
      console.error(
        `Lỗi khi cập nhật giá cho bookingPricingId: ${bookingPricing.id}, historyId: ${latestHistory.id}`,
        error
      );
    }
  }

  // --- TÍNH LẠI TỔNG GỐC ---
  const totalHistory = bookingPricing.history.reduce(
    (sum, h) => sum + (h.amount || 0),
    0
  );
  console.log("totalHistory:", totalHistory);

  const totalSurcharge: number = Array.isArray(booking.surcharge)
    ? (booking.surcharge as any[]).reduce((sum, s) => {
        if (s && typeof s === "object" && "Amount" in s) {
          const amt = (s as any).Amount;
          return sum + (typeof amt === "number" ? amt : 0);
        }
        return sum;
      }, 0)
    : 0;
  console.log("totalSurcharge:", totalSurcharge);

  const totalUtility: number = booking.items.reduce(
    (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
    0
  );

  let calculated = totalHistory + totalSurcharge + totalUtility;

  // Trừ trả trước & giảm giá
  if (note.Discount && note.Discount > 0) calculated -= note.Discount;
  if (note.PayInAdvance && note.PayInAdvance > 0)
    calculated -= note.PayInAdvance;

  // Nếu có giá thương lượng > 0 thì dùng luôn
  if (note.NegotiatedPrice && note.NegotiatedPrice > 0) {
    calculated = note.NegotiatedPrice;
  }

  const updatedBookingPricing = await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: { calculatedAmount: Math.max(0, calculated) }, // tránh âm
  });

  return { booking, bookingPricing: updatedBookingPricing };
};

export const addDocumentInfo = async (
  bookingId: string,
  doc: {
    ID: string;
    TypeID?: string;
    TypeId?: string; // accept alternate casing from client
    FullName: string;
    Address?: string;
    BirthDay?: string;
    Gender?: boolean;
    EthnicGroup?: string;
  }
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  // Lấy mảng hiện tại hoặc khởi tạo rỗng
  const currentDocs: any[] = Array.isArray(booking.documentInfo)
    ? booking.documentInfo
    : [];

  // Tạo entry mới
  const docEntry = {
    ID: doc.ID,
    TypeID: doc.TypeID ?? doc.TypeId ?? "CCCD",
    FullName: doc.FullName,
    Address: doc.Address || "",
    BirthDay: doc.BirthDay || "",
    Gender: typeof doc.Gender === "boolean" ? doc.Gender : false,
    EthnicGroup: doc.EthnicGroup || "",
  };

  // Push vào mảng
  currentDocs.push(docEntry);

  // Update booking.documentInfo
  const updatedBooking = await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: { documentInfo: currentDocs },
  });

  return updatedBooking;
};

// ================= ADD CAR =================
export const addCarInfo = async (
  bookingId: string,
  car: { LicensePlate: string; Color?: string; VehicleType?: string }
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  // Lấy mảng hiện tại hoặc khởi tạo rỗng
  const currentCars: any[] = Array.isArray(booking.carInfo)
    ? booking.carInfo
    : [];

  // Tạo entry mới
  const carEntry = {
    LicensePlate: car.LicensePlate,
    Color: car.Color || "",
    VehicleType: car.VehicleType || "",
  };

  // Push vào mảng
  currentCars.push(carEntry);

  // Update booking.carInfo
  const updatedBooking = await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: { carInfo: currentCars },
  });

  return updatedBooking;
};

// ================= GET DOCUMENT =================
export const getDocumentInfo = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });

  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  // Nếu booking.documentInfo là mảng JSON, trả về mảng, nếu null hoặc không phải mảng thì trả mảng rỗng
  const documents = Array.isArray(booking.documentInfo)
    ? booking.documentInfo
    : [];

  return documents;
};

// ================= GET CAR =================
export const getCarInfo = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });

  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  // Nếu booking.carInfo là mảng JSON, trả về mảng, nếu null hoặc không phải mảng thì trả mảng rỗng
  const cars = Array.isArray(booking.carInfo) ? booking.carInfo : [];

  return cars;
};

// ================= UPDATE DOCUMENT =================
export const updateDocumentInfo = async (
  bookingId: string,
  docId: string,
  updates: Partial<{
    ID: string;
    TypeID?: string;
    FullName?: string;
    Address?: string;
    BirthDay?: string;
    Gender?: boolean;
    EthnicGroup?: string;
  }>
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const documents: any[] = Array.isArray(booking.documentInfo)
    ? booking.documentInfo
    : [];

  // Tìm doc theo ID
  const docIndex = documents.findIndex((d) => d?.ID === docId);
  if (docIndex === -1)
    throw AppError.notFound("Không tìm thấy thông tin giấy tờ");

  const existingDoc = documents[docIndex] as Record<string, any>;

  // Cập nhật thông tin
  const updatedDoc = {
    ...existingDoc,
    ID: updates.ID ?? existingDoc.ID,
    TypeID: updates.TypeID ?? existingDoc.TypeID,
    FullName: updates.FullName ?? existingDoc.FullName,
    Address: updates.Address ?? existingDoc.Address,
    BirthDay: updates.BirthDay ?? existingDoc.BirthDay,
    Gender:
      typeof updates.Gender === "boolean" ? updates.Gender : existingDoc.Gender,
    EthnicGroup: updates.EthnicGroup ?? existingDoc.EthnicGroup,
  };

  documents[docIndex] = updatedDoc;

  // Lưu lại JSON
  await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: { documentInfo: documents },
  });

  return updatedDoc;
};

// ================= UPDATE CAR =================
export const updateCarInfo = async (
  bookingId: string,
  licensePlate: string,
  updates: Partial<{
    LicensePlate: string;
    Color?: string;
    VehicleType?: string;
  }>
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const cars: any[] = Array.isArray(booking.carInfo) ? booking.carInfo : [];

  // Tìm xe theo licensePlate
  const carIndex = cars.findIndex((c) => c?.LicensePlate === licensePlate);
  if (carIndex === -1) throw AppError.notFound("Không tìm thấy thông tin xe");

  const existingCar = cars[carIndex] as Record<string, any>;

  // Cập nhật thông tin xe
  const updatedCar = {
    ...existingCar,
    LicensePlate: updates.LicensePlate ?? existingCar.LicensePlate,
    Color: updates.Color ?? existingCar.Color,
    VehicleType: updates.VehicleType ?? existingCar.VehicleType,
  };

  cars[carIndex] = updatedCar;

  // Lưu lại JSON
  await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: { carInfo: cars },
  });

  return updatedCar;
};

// ================= BOOKING PRICING =================

export const addUtility = async (
  bookingId: string,
  utility: { id: number; price: number; name: string },
  quantity: number
) => {
  // --- Lấy booking ---
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { items: true, note: true },
  });
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  // --- Lấy bookingPricing ---
  const bookingPricing = await prisma.bookingPricing.findFirst({
    where: { bookingId: Number(bookingId) },
    include: { history: true },
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  // --- Cập nhật hoặc thêm utility ---
  const existingItem = booking.items.find(
    (item) => item.utilitiesId === utility.id
  );

  if (existingItem) {
    await prisma.bookingItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        price: utility.price,
      },
    });
  } else {
    await prisma.bookingItem.create({
      data: {
        bookingId: Number(bookingId),
        utilitiesId: utility.id,
        quantity,
        price: utility.price,
        name: utility.name,
      },
    });
  }

  // --- Lấy lại booking để có items mới nhất ---
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { items: true, note: true },
  });
  if (!updatedBooking)
    throw AppError.notFound("Không tìm thấy booking sau khi cập nhật!");

  // --- TÍNH LẠI TỔNG ---
  const totalHistory = bookingPricing.history.reduce(
    (sum, h) => sum + (h.amount || 0),
    0
  );

  const totalSurcharge: number = Array.isArray(updatedBooking.surcharge)
    ? (updatedBooking.surcharge as any[]).reduce((sum, s) => {
        if (s && typeof s === "object" && "Amount" in s) {
          const amt = (s as any).Amount;
          return sum + (typeof amt === "number" ? amt : 0);
        }
        return sum;
      }, 0)
    : 0;

  const totalUtility: number = updatedBooking.items.reduce(
    (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
    0
  );

  let calculated = totalHistory + totalSurcharge + totalUtility;

  // Trừ trả trước & giảm giá
  const note = updatedBooking.note;
  if (note?.Discount && note.Discount > 0) calculated -= note.Discount;
  if (note?.PayInAdvance && note.PayInAdvance > 0)
    calculated -= note.PayInAdvance;

  // Nếu có giá thương lượng thì override
  if (note?.NegotiatedPrice && note.NegotiatedPrice > 0) {
    calculated = note.NegotiatedPrice;
  }

  // --- Update bookingPricing ---
  const updatedBookingPricing = await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: { calculatedAmount: Math.max(0, calculated) }, // tránh âm
  });

  return { booking: updatedBooking, bookingPricing: updatedBookingPricing };
};

export const removeUtility = async (
  bookingId: string,
  utilityId: number,
  quantity: number = 1
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { items: true },
  });
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking!");
  }

  const bookingPricing = await prisma.bookingPricing.findFirst({
    where: { bookingId: Number(bookingId) },
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  const existingItem = booking.items.find(
    (item: { utilitiesId: number }) => item.utilitiesId === utilityId
  );
  if (!existingItem) {
    throw AppError.notFound("Tiện ích không tồn tại trong booking");
  }

  if (existingItem.quantity > quantity) {
    await prisma.bookingItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity - quantity },
    });
  } else {
    await prisma.bookingItem.delete({
      where: { id: existingItem.id },
    });
  }

  const decrementAmount =
    (existingItem.price ?? 0) * Math.min(quantity, existingItem.quantity);
  const newAmount = Math.max(
    (bookingPricing.calculatedAmount || 0) - decrementAmount,
    0
  );

  await prisma.bookingPricing.update({
    where: { id: bookingPricing.id },
    data: { calculatedAmount: newAmount },
  });

  return {
    booking: await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { items: true },
    }),
    bookingPricing: await prisma.bookingPricing.findUnique({
      where: { id: bookingPricing.id },
    }),
  };
};

export const deleteBooking = async (bookingId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Xóa PricingHistory theo BookingId
    await tx.pricingHistory.deleteMany({
      where: {
        bookingPricing: {
          bookingId: bookingId,
        },
      },
    });

    // 2. Xóa BookingPricing
    await tx.bookingPricing.deleteMany({
      where: { bookingId },
    });

    // 3. Xóa BookingItem
    await tx.bookingItem.deleteMany({
      where: { bookingId },
    });

    // 4. Xóa Note
    await tx.note.deleteMany({
      where: { bookingId },
    });

    // 5. Xóa Booking
    const deletedBooking = await tx.booking.delete({
      where: { id: bookingId },
    });

    // 6. Cập nhật trạng thái phòng (nếu cần)
    await tx.room.update({
      where: { id: deletedBooking.roomId },
      data: { typeHire: 0 },
    });

    return {
      success: true,
      message: "Xóa booking và các dữ liệu liên quan thành công",
    };
  });
};

export const getNote = async (bookingId: string): Promise<Note | null> => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { note: true },
  });

  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking");
  }

  if (!booking.note) {
    return null;
  }

  // booking.note lúc này đã đúng type của Prisma
  return {
    BookingId: bookingId,
    Content: booking.note.Content ?? undefined,
    Discount: booking.note.Discount,
    PayInAdvance: booking.note.PayInAdvance,
    NegotiatedPrice: booking.note.NegotiatedPrice ?? undefined,
    BookingPricingId: booking.note.BookingPricingId ?? undefined,
  };
};

const MAX_RETRIES = 3;

// Hàm tính thời gian (tương tự cacutaleTime)
const calculateTime = (appliedFrom: string, appliedTo?: string): number => {
  if (!appliedFrom) return 0;

  const from = new Date(appliedFrom);
  const to = appliedTo ? new Date(appliedTo) : new Date();

  const diffMs = to.getTime() - from.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 0 ? diffHours : 0;
};

// Hàm tính giá theo giờ (tương tự cacutaleHour)
const calculateHour = (
  historyPricing: PricingHistory,
  originalPrice: number,
  afterHoursPrice: number
): PricingHistory => {
  const hours = calculateTime(
    historyPricing.appliedFrom.toISOString(),
    historyPricing.appliedTo?.toISOString()
  );

  if (hours <= 0) {
    return { ...historyPricing, amount: 0 };
  }

  const firstHourPrice = originalPrice;
  const nextHourPrice = afterHoursPrice;
  let amount = firstHourPrice;

  if (hours > 1) {
    const extraHours = hours - 1;
    const roundedExtraHours = Math.floor(extraHours / 0.2) * 0.2;
    amount += roundedExtraHours * nextHourPrice;
  }

  return {
    ...historyPricing,
    appliedFirstHourPrice: firstHourPrice,
    appliedNextHourPrice: nextHourPrice,
    amount,
  };
};

export const moveRoom = async (bookingId: string, newRoomId: string) => {
  const bookingIdNum = Number(bookingId);
  const newRoomIdNum = Number(newRoomId);

  return prisma.$transaction(async (tx) => {
    // --- 1. Lấy booking và validate ---
    const booking = await tx.booking.findUnique({
      where: { id: bookingIdNum },
      include: { items: true, note: true }, // surcharge bỏ include
    });
    if (!booking) throw AppError.notFound("Không tìm thấy booking");

    const oldRoom = await tx.room.findUnique({ where: { id: booking.roomId } });
    if (!oldRoom) throw AppError.notFound("Không tìm thấy phòng hiện tại");

    const newRoom = await tx.room.findUnique({ where: { id: newRoomIdNum } });
    if (!newRoom) throw AppError.notFound("Không tìm thấy phòng cần đổi");
    if (!newRoom.status)
      throw AppError.badRequest("Phòng cần đổi không khả dụng");
    if (newRoomIdNum === booking.roomId)
      throw AppError.badRequest("Phòng mới phải khác phòng hiện tại");
    if (newRoom.hotelId !== oldRoom.hotelId)
      throw AppError.badRequest("Phòng mới phải thuộc cùng khách sạn");

    const bookingPricing = await tx.bookingPricing.findFirst({
      where: { bookingId: bookingIdNum },
    });
    if (!bookingPricing)
      throw AppError.notFound("Không tìm thấy thông tin giá cho booking");

    // --- 2. Xác định typeHire mới ---
    const typeHireMap: Record<string, number> = { HOUR: 1, NIGHT: 2, DAY: 3 };
    const newTypeHire = typeHireMap[bookingPricing.priceType] || 1;

    // --- 3. Recalculate Pricing History ---
    const histories = await tx.pricingHistory.findMany({
      where: { bookingPricingId: bookingPricing.id },
    });

    const updatedHistory = histories.map((h) => {
      switch (h.priceType) {
        case "HOUR":
          return calculateHour(
            h,
            newRoom.originalPrice,
            newRoom.afterHoursPrice
          );
        case "NIGHT":
          return {
            ...h,
            amount: newRoom.nightPrice ?? 0,
            appliedNightPrice: newRoom.nightPrice ?? 0,
          };
        case "DAY":
          return {
            ...h,
            amount: newRoom.dayPrice ?? 0,
            appliedDayPrice: newRoom.dayPrice ?? 0,
          };
        default:
          throw new Error(`Unsupported priceType: ${h.priceType}`);
      }
    });

    // --- 4. Tính tổng tiền ---
    const totalHistory = updatedHistory.reduce(
      (sum, h) => sum + (h.amount ?? 0),
      0
    );

    const totalSurcharge = Array.isArray(booking.surcharge)
      ? booking.surcharge.reduce((sum, s: any) => sum + (s.amount ?? 0), 0)
      : 0;

    const totalUtility = Array.isArray(booking.items)
      ? booking.items.reduce(
          (sum, u: any) => sum + (u.price ?? 0) * (u.quantity ?? 1),
          0
        )
      : 0;

    let calculated =
      Number(totalHistory) + Number(totalSurcharge) + totalUtility;

    if (booking.note) {
      const { Discount, PayInAdvance, NegotiatedPrice } = booking.note;
      if (Discount && Discount > 0) calculated -= Discount;
      if (PayInAdvance && PayInAdvance > 0) calculated -= PayInAdvance;
      if (NegotiatedPrice && NegotiatedPrice > 0) calculated = NegotiatedPrice;
    }

    // --- 5. Update database ---
    await Promise.all([
      tx.room.update({ where: { id: oldRoom.id }, data: { typeHire: 0 } }),
      tx.room.update({
        where: { id: newRoom.id },
        data: { typeHire: newTypeHire },
      }),
      tx.booking.update({
        where: { id: bookingIdNum },
        data: { roomId: newRoomIdNum },
      }),
      tx.bookingPricing.update({
        where: { id: bookingPricing.id },
        data: {
          roomId: newRoomIdNum,
          calculatedAmount: Math.max(0, calculated),
        },
      }),
      ...updatedHistory.map((h) =>
        tx.pricingHistory.update({ where: { id: h.id }, data: h })
      ),
    ]);

    // --- 6. Return kết quả ---
    const [updatedBooking, updatedPricing, oldRoomUpdated, newRoomUpdated] =
      await Promise.all([
        tx.booking.findUnique({
          where: { id: bookingIdNum },
          include: { items: true, note: true },
        }),
        tx.bookingPricing.findUnique({ where: { id: bookingPricing.id } }),
        tx.room.findUnique({ where: { id: oldRoom.id } }),
        tx.room.findUnique({ where: { id: newRoom.id } }),
      ]);

    return {
      booking: updatedBooking,
      bookingPricing: updatedPricing,
      oldRoom: oldRoomUpdated,
      newRoom: newRoomUpdated,
    };
  });
};

export const changePriceType = async (
  bookingId: string,
  newPriceType: "HOUR" | "DAY" | "NIGHT"
) => {
  console.log("changePriceType called with:", bookingId, newPriceType);
  const bookingIdNum = Number(bookingId);
  if (isNaN(bookingIdNum)) throw AppError.badRequest("bookingId không hợp lệ");

  return prisma.$transaction(async (tx) => {
    // 1. Lấy booking + bookingPricing + room
    const booking = await tx.booking.findUnique({
      where: { id: bookingIdNum },
      include: { items: true, note: true },
    });
    if (!booking) throw AppError.notFound("Không tìm thấy booking");

    const bookingPricing = await tx.bookingPricing.findFirst({
      where: { bookingId: bookingIdNum },
      include: { history: true },
    });
    if (!bookingPricing)
      throw AppError.notFound("Không tìm thấy thông tin giá cho booking");

    const room = await tx.room.findUnique({ where: { id: booking.roomId } });
    if (!room) throw AppError.notFound("Không tìm thấy phòng");

    const currentTime = new Date();
    const MS_IN_24H = 24 * 60 * 60 * 1000;

    const histories = [...bookingPricing.history].sort(
      (a, b) => a.appliedFrom.getTime() - b.appliedFrom.getTime()
    );
    const latestHistory = histories[histories.length - 1];
    const prevHistory = histories[histories.length - 2];

    if (!latestHistory)
      throw AppError.badRequest("Không tìm thấy lịch sử giá hiện tại");

    const typeHireMap: Record<string, number> = { HOUR: 1, NIGHT: 2, DAY: 3 };

    // --- Helpers ---
    const updateRoomTypeHire = async () => {
      await tx.room.update({
        where: { id: room.id },
        data: { typeHire: typeHireMap[newPriceType] },
      });
    };

    const updateHistory = async (
      historyId: number,
      data: Record<string, any>
    ) => {
      await tx.pricingHistory.update({ where: { id: historyId }, data });
    };

    const createHistory = async (data: Record<string, any>) => {
      await tx.pricingHistory.create({
        data: {
          ...data,
          bookingPricingId: bookingPricing.id,
          action: "CHANGE_TYPE",
        },
      });
    };

    // --- 2. Xử lý đổi loại giá ---
    if (latestHistory.priceType === "HOUR" && newPriceType === "DAY") {
      const appliedToTime = latestHistory.appliedTo ?? currentTime;
      const elapsed = currentTime.getTime() - appliedToTime.getTime();

      if (elapsed >= MS_IN_24H) {
        await updateHistory(latestHistory.id, { appliedTo: currentTime });
        await createHistory({
          priceType: "DAY",
          amount: room.dayPrice || 0,
          appliedFrom: currentTime,
          appliedDayPrice: room.dayPrice,
        });
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "DAY",
          amount: room.dayPrice || 0,
          appliedDayPrice: room.dayPrice,
          appliedFirstHourPrice: 0,
          appliedNextHourPrice: 0,
        });
      }
      await updateRoomTypeHire();
    } else if (latestHistory.priceType === "HOUR" && newPriceType === "NIGHT") {
      const appliedFrom = latestHistory.appliedFrom;
      const sevenPM = new Date(appliedFrom);
      sevenPM.setHours(19, 0, 0, 0);

      if (appliedFrom < sevenPM && currentTime > sevenPM) {
        await updateHistory(latestHistory.id, { appliedTo: sevenPM });
        await createHistory({
          priceType: "NIGHT",
          amount: room.nightPrice || 0,
          appliedFrom: sevenPM,
          appliedNightPrice: room.nightPrice,
        });
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "NIGHT",
          amount: room.nightPrice || 0,
          appliedNightPrice: room.nightPrice,
          appliedFirstHourPrice: 0,
          appliedNextHourPrice: 0,
        });
      }
      await updateRoomTypeHire();
    } else if (latestHistory.priceType === "NIGHT" && newPriceType === "DAY") {
      if (prevHistory?.priceType === "DAY") {
        const fullDayMark = new Date(prevHistory.appliedFrom);
        fullDayMark.setHours(fullDayMark.getHours() + 24);
        if (currentTime < fullDayMark) {
          await tx.pricingHistory.delete({ where: { id: latestHistory.id } });
          await updateHistory(prevHistory.id, { appliedTo: null });
        }
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "DAY",
          amount: room.dayPrice || 0,
          appliedDayPrice: room.dayPrice,
          appliedNightPrice: 0,
        });
      }
      await updateRoomTypeHire();
    } else if (latestHistory.priceType === "NIGHT" && newPriceType === "HOUR") {
      if (prevHistory?.priceType === "HOUR") {
        if (prevHistory.appliedTo) {
          const diffMs =
            currentTime.getTime() - prevHistory.appliedTo.getTime();
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
          await updateHistory(prevHistory.id, {
            appliedTo: null,
            amount:
              (prevHistory.amount ?? 0) +
              diffHours * (room.afterHoursPrice || 0),
          });
        }
        await tx.pricingHistory.delete({ where: { id: latestHistory.id } });
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "HOUR",
          appliedNightPrice: 0,
          appliedFirstHourPrice: room.originalPrice,
          appliedNextHourPrice: room.afterHoursPrice,
        });
      }
      await updateRoomTypeHire();
    } else if (latestHistory.priceType === "DAY" && newPriceType === "HOUR") {
      if (prevHistory?.priceType === "HOUR") {
        if (prevHistory.appliedTo) {
          const diffMs =
            currentTime.getTime() - prevHistory.appliedTo.getTime();
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
          await updateHistory(prevHistory.id, {
            appliedTo: null,
            amount:
              (prevHistory.amount ?? 0) +
              diffHours * (room.afterHoursPrice || 0),
          });
        }
        await tx.pricingHistory.delete({ where: { id: latestHistory.id } });
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "HOUR",
          appliedDayPrice: 0,
          appliedFirstHourPrice: room.originalPrice,
          appliedNextHourPrice: room.afterHoursPrice,
        });
      }
      await updateRoomTypeHire();
    } else if (latestHistory.priceType === "DAY" && newPriceType === "NIGHT") {
      if (prevHistory?.priceType === "NIGHT") {
        const noonNextDay = new Date(prevHistory.appliedFrom);
        noonNextDay.setDate(noonNextDay.getDate() + 1);
        noonNextDay.setHours(12, 0, 0, 0);
        if (currentTime < noonNextDay) {
          await tx.pricingHistory.delete({ where: { id: latestHistory.id } });
          await updateHistory(prevHistory.id, { appliedTo: null });
        }
      } else {
        await updateHistory(latestHistory.id, {
          priceType: "NIGHT",
          appliedDayPrice: 0,
          appliedNightPrice: room.nightPrice,
          amount: room.nightPrice || 0,
        });
      }
      await updateRoomTypeHire();
    } else {
      throw AppError.badRequest(
        "Loại giá không hợp lệ hoặc không cần thay đổi"
      );
    }

    // --- 3. Recalculate tổng tiền ---
    const historiesUpdated = await tx.pricingHistory.findMany({
      where: { bookingPricingId: bookingPricing.id },
    });
    const totalHistory = historiesUpdated.reduce(
      (sum, h) => sum + (h.amount ?? 0),
      0
    );

    const surchargeArr = (booking.surcharge as any[]) ?? [];
    const totalSurcharge = Array.isArray(surchargeArr)
      ? surchargeArr.reduce(
          (sum, s) => sum + (typeof s.amount === "number" ? s.amount : 0),
          0
        )
      : 0;

    const itemsArr = booking.items ?? [];
    const totalUtility = Array.isArray(itemsArr)
      ? itemsArr.reduce(
          (sum, u) =>
            sum +
            (typeof u.price === "number" ? u.price : 0) *
              (typeof u.quantity === "number" ? u.quantity : 1),
          0
        )
      : 0;

    let calculated = totalHistory + totalSurcharge + totalUtility;
    if (booking.note?.Discount) calculated -= booking.note.Discount;
    if (booking.note?.PayInAdvance) calculated -= booking.note.PayInAdvance;
    if (booking.note?.NegotiatedPrice && booking.note.NegotiatedPrice > 0)
      calculated = booking.note.NegotiatedPrice;

    await tx.bookingPricing.update({
      where: { id: bookingPricing.id },
      data: {
        priceType: newPriceType,
        calculatedAmount: Math.max(0, calculated),
      },
    });

    // --- 4. Return ---
    const [updatedBooking, updatedPricing, updatedRoom] = await Promise.all([
      tx.booking.findUnique({ where: { id: booking.id } }),
      tx.bookingPricing.findUnique({
        where: { id: bookingPricing.id },
        include: { history: true },
      }),
      tx.room.findUnique({ where: { id: room.id } }),
    ]);

    return {
      booking: updatedBooking,
      bookingPricing: updatedPricing,
      room: updatedRoom,
    };
  });
};

/**
 * Lấy danh sách booking theo hotelId với định dạng giống như bill
 * Chỉ lấy các phòng đang được thuê (typeHire > 0)
 */
export const getBookingsByHotelId = async (hotelId: string) => {
  const hotelIdNum = Number(hotelId); // hotelId là Int trong schema
  if (isNaN(hotelIdNum)) throw AppError.badRequest("ID khách sạn không hợp lệ");

  // 1. Validate hotel existence
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelIdNum } });
  if (!hotel) throw AppError.notFound("ID khách sạn không tồn tại");

  // 2. Query bookings + join room, bookingPricing, items + utilities
  const bookings = await prisma.booking.findMany({
    where: {
      room: { hotelId: hotelIdNum, typeHire: { gt: 0 } },
    },
    include: {
      room: true,
      bookingPricings: true,
      items: { include: { utility: true } },
    },
  });

  // 3. Map kết quả + tính tổng tiền
  return bookings.map((booking) => {
    // Tổng tiền phòng
    const totalRoomPrice = booking.bookingPricings.reduce(
      (sum, pricing) => sum + (pricing.calculatedAmount ?? 0),
      0
    );

    // Tổng tiền dịch vụ
    const totalUtilitiesPrice = booking.items.reduce((sum, item) => {
      const price = item.utility?.price ?? 0;
      const quantity = item.quantity ?? 1;
      return sum + price * quantity;
    }, 0);

    return {
      totalRoomPrice,
      totalUtilitiesPrice,
      roomId: booking.roomId,
      hotelId: booking.room.hotelId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  });
};

export const getBookingsByRoomIds = async (
  roomIds: string[],
  date?: string
) => {
  if (!roomIds) {
    throw AppError.badRequest("Danh sách roomId không hợp lệ");
  }

  // Chuyển roomIds sang number
  const roomIdsNum = roomIds.map((id) => {
    const num = Number(id);
    if (isNaN(num)) throw AppError.badRequest(`roomId không hợp lệ: ${id}`);
    return num;
  });

  // --- 1. Build where condition ---
  let whereCondition: any = { roomId: { in: roomIdsNum } };

  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    whereCondition = {
      ...whereCondition,
      OR: [
        { checkin: { gte: startOfDay, lte: endOfDay } }, // Checkin trong ngày
        {
          checkin: { lt: startOfDay },
          OR: [{ checkout: null }, { checkout: { gt: startOfDay } }],
        }, // Active trong ngày
      ],
    };
  }

  // --- 2. Query Prisma ---
  const bookings = await prisma.booking.findMany({
    where: whereCondition,
    include: {
      room: { select: { id: true, name: true, hotelId: true } },
      bookingPricings: true,
      items: { include: { utility: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // --- 3. Map kết quả + tính tổng ---
  return bookings.map((b) => {
    const totalRoomPrice = b.bookingPricings.reduce(
      (sum, p) => sum + (p.calculatedAmount ?? 0),
      0
    );

    const totalUtilitiesPrice = b.items.reduce((sum, item) => {
      const price = item.utility?.price ?? 0;
      const quantity = item.quantity ?? 1;
      return sum + price * quantity;
    }, 0);

    return {
      id: b.id,
      roomName: b.room.name,
      hotelId: b.room.hotelId,
      createdAt: b.createdAt,
      checkIn: b.checkin,
      checkOut: b.checkout,
      totalRoomPrice,
      totalUtilitiesPrice,
    };
  });
};
