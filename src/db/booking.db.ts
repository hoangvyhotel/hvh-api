import mongoose, { Types } from "mongoose";
import { RoomModel, IRoomDocument } from "@/models/Room";
import Booking, { IBooking } from "@/models/Booking";
import { IUtility } from "@/models/Utility";
import { ParamsRequest } from "@/types/request/base";
import { BaseResponse } from "@/types/response";
import { ResponseHelper } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { GetBookingInfo, Note, Surcharge } from "@/types/response/booking";
import BookingPricing, {
  BookingPricingDocument,
  PricingHistory,
} from "@/models/BookingPricing";
import { PricingHistoryData } from "@/types/response/bookingPricing";
import { TYPE_BOOKINGS } from "@/constant/constant";
import { calculateAndUpdatePricing } from "@/utils/booking.util";

type UtilitiesForBooking = {
  Quantity: number;
  Icon: string;
};
export interface PricingData {
  _id: Types.ObjectId;
  priceType: string;
  startTime: Date;
  endTime?: Date;
  room: IRoomDocument;
  appliedFirstHourPrice: number;
  appliedNextHourPrice: number;
  appliedDayPrice: number;
  appliedNightPrice: number;
  calculatedAmount: number;
}

interface PipelineBookingPricing {
  _id: string | Types.ObjectId;
  priceType: string;
  startTime: Date | string;
  endTime?: Date | string;
  appliedFirstHourPrice?: number;
  appliedNextHourPrice?: number;
  appliedDayPrice?: number;
  appliedNightPrice?: number;
  calculatedAmount?: number;
  history: PricingHistoryData[];
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

export const getRoomsByHotel = async (
  req: ParamsRequest<{ id: string }>
): Promise<GetRoomsByHotel[]> => {
  const { id } = req.params;
  console.log("id", id);

  // 1. Lấy tất cả phòng của khách sạn
  const rooms: IRoomDocument[] = await RoomModel.find({
    hotelId: new mongoose.Types.ObjectId(id),
    status: true,
  });

  const roomIds = rooms.map((r) => new mongoose.Types.ObjectId(r._id));

  // 2. Lấy các booking có roomId trong danh sách
  const bookings = await Booking.find({
    roomId: { $in: roomIds },
  })
    .populate("items.utilitiesId") // populate utilities
    .lean<IBooking[]>(); // lấy plain object thay vì Document

  // 3. Map roomId -> booking hiện tại
  const bookingMap: Record<string, IBooking | undefined> = {};
  bookings.forEach((b) => {
    bookingMap[b.roomId.toString()] = b;
  });

  // 4. Build dữ liệu trả về
  const data: GetRoomsByHotel[] = rooms.map((room) => {
    const booking = bookingMap[room._id.toString()];

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
      RoomId: room._id.toString(),
      RoomName: room.name,
      Status: booking ? "CHECKIN" : "FREE",
      TypeBooking: typeBooking,
      Utilities: booking
        ? (booking.items ?? []).map((item) => ({
            Quantity: item.quantity,
            Icon: (item.utilitiesId as any)?.icon || "",
          }))
        : undefined,
      Description: room.description,
      Floor: room.floor,
      Checkin: booking?.checkin,
    };
  });

  return data;
};

export const getBookings = async (): Promise<IBooking[]> => {
  return await Booking.find({}).populate("roomId").exec();
};

export const AddBooking = async (
  roomId: string,
  session?: any
): Promise<any> => {
  if (!Types.ObjectId.isValid(roomId)) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  try {
    const booking = await Booking.create(
      [
        {
          roomId: new Types.ObjectId(roomId),
          checkin: new Date(),
        },
      ],
      { session } // truyền session vào đây
    );
    return booking[0];
  } catch (error) {
    console.error("Lỗi khi tạo booking:", error);
    throw AppError.internal("Không thể tạo booking");
  }
};

export const getBookingInfo = async (
  req: ParamsRequest<{ roomId: string }>
): Promise<GetBookingInfo> => {
  const { roomId } = req.params;
  const roomObjectId = new Types.ObjectId(roomId);

  const pipeline = [
    { $match: { roomId: roomObjectId } },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },
    {
      $lookup: {
        from: "utilities",
        localField: "items.utilitiesId",
        foreignField: "_id",
        as: "utilitiesData",
      },
    },
    {
      $lookup: {
        from: "bookingpricings",
        let: { bookingId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$bookingId", "$$bookingId"] },
            },
          },
          {
            $project: {
              _id: 1,
              priceType: 1,
              startTime: 1,
              endTime: 1,
              calculatedAmount: 1,
              history: 1,
            },
          },
        ],
        as: "bookingPricings",
      },
    },
    {
      $addFields: {
        Utilities: {
          $map: {
            input: "$items",
            as: "it",
            in: {
              _id: "$$it.utilitiesId",
              Name: "$$it.name",
              Quantity: "$$it.quantity",
              Price: "$$it.price",
              Icon: {
                $let: {
                  vars: {
                    util: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$utilitiesData",
                            as: "u",
                            cond: { $eq: ["$$u._id", "$$it.utilitiesId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$util.icon",
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        BookingId: { $toString: "$_id" },
        RoomName: { $ifNull: ["$room.name", "Phòng không xác định"] },
        TypeHire: "$room.typeHire",
        documentInfo: 1,
        checkin: 1,
        carInfo: 1,
        surcharge: 1,
        note: 1,
        Utilities: 1,
        BookingPricing: "$bookingPricings",
      },
    },
  ];

  const result = await Booking.aggregate(pipeline).exec();
  if (!result || result.length === 0) {
    throw new Error("Không tìm thấy booking cho roomId này");
  }

  const b = result[0];

  // Cập nhật giá cho bản ghi lịch sử mới nhất của BookingPricing duy nhất
  if (
    b.BookingPricing &&
    b.BookingPricing.length > 0 &&
    b.BookingPricing[0]._id
  ) {
    const bp = b.BookingPricing[0]; // Lấy BookingPricing duy nhất
    if (
      bp.history &&
      bp.history.length > 0 &&
      bp.history[bp.history.length - 1]._id
    ) {
      const latestHistory = bp.history[bp.history.length - 1]; // Lấy bản ghi lịch sử cuối cùng
      const bookingPricingId = bp._id.toString();
      const historyId = latestHistory._id.toString();

      try {
        // Gọi calculateAndUpdatePricing cho bản ghi lịch sử mới nhất
        await calculateAndUpdatePricing(bookingPricingId, historyId, roomId);

        // Chạy lại pipeline để lấy dữ liệu BookingPricing đã cập nhật
        const updatedResult = await Booking.aggregate(pipeline).exec();
        if (updatedResult && updatedResult.length > 0) {
          b.BookingPricing = updatedResult[0].BookingPricing;
        }
      } catch (error) {
        console.error(
          `Lỗi khi cập nhật giá cho bookingPricingId: ${bookingPricingId}, historyId: ${historyId}`,
          error
        );
        // Tiếp tục thực thi mà không ném lỗi
      }
    } else {
      console.warn(
        `Không tìm thấy history hoặc history._id cho BookingPricing: ${bp._id}`
      );
    }
  } else {
    console.warn(
      `Không tìm thấy BookingPricing hoặc BookingPricing._id cho roomId: ${roomId}`
    );
  }

  // Hàm tính số giờ và làm tròn đến 1 chữ số sau dấu phẩy
  const calculateHours = (
    start: string | Date,
    end?: string | Date
  ): number => {
    if (!start) return 0;
    const startDate = new Date(start);
    // Nếu không có end, sử dụng thời điểm hiện tại
    const endDate = end ? new Date(end) : new Date();
    // Kiểm tra tính hợp lệ của ngày
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Làm tròn đến 1 chữ số sau dấu phẩy
  };

  // Tính tổng số giờ của booking từ CheckinDate đến thời điểm hiện tại
  const totalHours = calculateHours(b.checkin, undefined);

  return {
    BookingId: b.BookingId,
    RoomName: b.RoomName,
    TypeBooking:
      b.TypeHire === 1
        ? TYPE_BOOKINGS.HOUR
        : b.TypeHire === 2
        ? TYPE_BOOKINGS.NIGHT
        : b.TypeHire === 3
        ? TYPE_BOOKINGS.DAY
        : TYPE_BOOKINGS.HOUR,
    CheckinDate: b.checkin,
    Times: totalHours,
    Utilities: b.Utilities ?? [],
    Documents: (b.documentInfo ?? []).map((doc: any) => ({
      ID: doc.ID || "",
      TypeID: doc.TypeID || "CCCD",
      FullName: doc.FullName || "",
      Address: doc.Address || "",
      BirthDay: doc.BirthDay || "",
      Gender: doc.Gender || false,
      EthnicGroup: doc.EthnicGroup || "",
    })),
    CarInfos: (b.carInfo ?? []).map((c: any) => ({
      LicensePlate: c.LicensePlate || "",
    })),
    Surcharge: (b.surcharge ?? []).map((s: any) => ({
      Content: s.Content || "",
      Amount: s.Amount || 0,
    })),
    Notes: b.note
      ? {
          Content: b.note.Content || "",
          Discount: b.note.Discount || 0,
          PayInAdvance: b.note.PayInAdvance || 0,
          NegotiatedPrice: b.note.NegotiatedPrice || 0,
        }
      : undefined,
    BookingPricing: (b.BookingPricing ?? []).map((bp: any) => ({
      PriceType: bp.priceType,
      StartDate: bp.startTime,
      EndDate: bp.endTime,
      CalculatedAmount: bp.calculatedAmount,
      History: (bp.history ?? []).map((h: any) => ({
        Action: h.action,
        PriceType: h.priceType,
        Amount: h.amount,
        Description: h.description,
        AppliedFrom: h.appliedFrom,
        AppliedTo: h.appliedTo,
        AppliedFirstHourPrice: h.appliedFirstHourPrice,
        AppliedNextHourPrice: h.appliedNextHourPrice,
        AppliedDayPrice: h.appliedDayPrice,
        AppliedNightPrice: h.appliedNightPrice,
        Times: calculateHours(h.appliedFrom, h.appliedTo),
      })),
    })),
  };
};

export const addSurcharge = async (surcharge: Surcharge) => {
  const booking = await Booking.findById(surcharge.BookingId);
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking!");
  }

  // Thêm surcharge vào booking
  const surchargeBooking: Surcharge = {
    Content: surcharge.Content,
    Amount: surcharge.Amount,
  };

  booking.surcharge?.push(surchargeBooking);
  await booking.save();
  console.log();
  const bookingPricing = await BookingPricing.findOne({
    bookingId: surcharge.BookingId,
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  bookingPricing.calculatedAmount =
    (bookingPricing.calculatedAmount || 0) + surcharge.Amount!;

  await bookingPricing.save();

  return {
    booking,
    bookingPricing,
  };
};

export const addNote = async (bookingId: string, note: Note) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound("Không tìm thấy booking!");

  const bookingPricing = await BookingPricing.findOne({ bookingId });
  if (!bookingPricing)
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");

  // Lưu ghi chú
  booking.note = note;
  await booking.save();

  // --- CẬP NHẬT GIÁ LỊCH SỬ MỚI NHẤT ---
  if (bookingPricing.history && bookingPricing.history.length > 0) {
    const latestHistory =
      bookingPricing.history[bookingPricing.history.length - 1];
    if (latestHistory._id && bookingPricing._id) {
      try {
        // Gọi calculateAndUpdatePricing cho lịch sử mới nhất
        await calculateAndUpdatePricing(
          bookingPricing._id.toString(),
          latestHistory._id.toString(),
          booking.roomId?.toString() || "" // nếu cần roomId
        );

        // Reload bookingPricing sau khi cập nhật
        const updated = await BookingPricing.findById(bookingPricing._id);
        if (updated) Object.assign(bookingPricing, updated);
      } catch (error) {
        console.error(
          `Lỗi khi cập nhật giá cho bookingPricingId: ${bookingPricing._id}, historyId: ${latestHistory._id}`,
          error
        );
      }
    }
  }

  // --- TÍNH LẠI TỔNG GỐC sau khi cập nhật lịch sử ---
  const totalHistory =
    bookingPricing.history?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0;

  const totalSurcharge =
    booking.surcharge?.reduce((sum, s) => sum + (s.Amount || 0), 0) || 0;
  const totalUtility =
    booking.items?.reduce(
      (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
      0
    ) || 0;
  let calculated = totalHistory + totalSurcharge + totalUtility;

  // Trừ trả trước & giảm giá
  if (note.Discount && note.Discount > 0) calculated -= note.Discount;
  if (note.PayInAdvance && note.PayInAdvance > 0)
    calculated -= note.PayInAdvance;

  // Nếu có giá thương lượng > 0 thì dùng luôn
  if (note.NegotiatedPrice && note.NegotiatedPrice > 0) {
    calculated = note.NegotiatedPrice;
  }

  bookingPricing.calculatedAmount = Math.max(0, calculated); // tránh âm
  await bookingPricing.save();

  return { booking, bookingPricing };
};

export const addUtility = async (
  bookingId: string,
  utility: IUtility,
  quantity: number
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking!");
  }

  const bookingPricing = await BookingPricing.findOne({ bookingId });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  const utilityId = utility._id as Types.ObjectId;

  const existingItem = booking.items.find((item) =>
    item.utilitiesId.equals(utilityId)
  );

  if (existingItem) {
    // Nếu tồn tại, cộng quantity và cập nhật giá
    existingItem.quantity += quantity;
    existingItem.price = utility.price; // giữ giá hiện tại
  } else {
    // Nếu chưa tồn tại, push item mới
    booking.items.push({
      utilitiesId: utility._id as Types.ObjectId,
      quantity,
      price: utility.price,
      name: utility.name,
    });
  }

  await booking.save();
  // Cập nhật tổng tiền nếu không có giá thỏa thuận
  if (!booking.note?.NegotiatedPrice || booking.note.NegotiatedPrice <= 0) {
    console.log("amount", utility.price);
    bookingPricing.calculatedAmount =
      (bookingPricing.calculatedAmount || 0) + utility.price * quantity;
  }

  await bookingPricing.save();

  return { booking, bookingPricing };
};

export const removeUtility = async (
  bookingId: string,
  utilityId: string,
  quantity: number = 1
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking!");
  }

  const bookingPricing = await BookingPricing.findOne({ bookingId });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  const itemIndex = booking.items.findIndex((item) =>
    item.utilitiesId.equals(utilityId)
  );

  if (itemIndex === -1) {
    throw AppError.notFound("Tiện ích không tồn tại trong booking");
  }

  const item = booking.items[itemIndex];

  if (item.quantity > quantity) {
    // Giảm số lượng
    item.quantity -= quantity;
  } else {
    // Xóa hoàn toàn item nếu quantity <= số lượng hiện tại
    booking.items.splice(itemIndex, 1);
  }

  await booking.save();

  // Cập nhật calculatedAmount
  const decrementAmount =
    item.price! * Math.min(quantity, item.quantity + quantity);
  bookingPricing.calculatedAmount =
    (bookingPricing.calculatedAmount || 0) - decrementAmount;

  if (bookingPricing.calculatedAmount < 0) bookingPricing.calculatedAmount = 0;

  await bookingPricing.save();

  return { booking, bookingPricing };
};

export const deleteBooking = async (bookingId: string) => {
  // 1️⃣ Lấy booking để biết roomId
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking");
  }

  const roomId = booking.roomId;

  // 2️⃣ Xóa booking
  await Booking.findByIdAndDelete(bookingId);

  // 3️⃣ Cập nhật typeHire của phòng về 0
  await RoomModel.findByIdAndUpdate(roomId, { typeHire: 0 });

  return {
    success: true,
    message: "Xóa booking thành công và cập nhật phòng",
  };
};

/**
 * Lấy danh sách booking theo hotelId với định dạng giống như bill
 * Chỉ lấy các phòng đang được thuê (typeHire > 0)
 */
export const getBookingsByHotelId = async (hotelId: string) => {
  if (!Types.ObjectId.isValid(hotelId)) {
    throw new Error("ID khách sạn không hợp lệ");
  }

  // Pipeline để join booking với room và tính toán pricing
  const pipeline = [
    // 1. Lookup rooms của hotel
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },
    // 2. Filter theo hotelId và typeHire > 0
    {
      $match: {
        "room.hotelId": new Types.ObjectId(hotelId),
        "room.typeHire": { $gt: 0 },
      },
    },
    // 3. Lookup booking pricing
    {
      $lookup: {
        from: "bookingpricings",
        localField: "_id",
        foreignField: "bookingId",
        as: "pricing",
      },
    },
    // 4. Lookup utilities từ booking items
    {
      $lookup: {
        from: "utilities",
        localField: "items.utilitiesId",
        foreignField: "_id",
        as: "utilities",
      },
    },
    // 5. Project để tạo định dạng giống bill
    {
      $project: {
        totalRoomPrice: {
          $sum: "$pricing.calculatedAmount",
        },
        totalUtilitiesPrice: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $let: {
                  vars: {
                    utility: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$utilities",
                            cond: { $eq: ["$$this._id", "$$item.utilitiesId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    $multiply: [
                      "$$item.quantity",
                      { $ifNull: ["$$utility.price", 0] },
                    ],
                  },
                },
              },
            },
          },
        },
        roomId: "$roomId",
        hotelId: "$room.hotelId",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
      },
    },
  ];

  const bookings = await Booking.aggregate(pipeline);
  return bookings;
};

/**
 * Lấy danh sách booking theo danh sách roomIds với định dạng giống như bill
 */
export const getBookingsByRoomIds = async (roomIds: string[]) => {
  if (!roomIds || roomIds.length === 0) {
    return [];
  }

  // Convert string roomIds to ObjectIds
  const objectIds = roomIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) {
    return [];
  }

  // Pipeline để join booking với room và tính toán pricing
  const pipeline = [
    // 1. Match theo roomIds
    {
      $match: {
        roomId: { $in: objectIds },
      },
    },
    // 2. Lookup room information
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },
    // 3. Lookup booking pricing
    {
      $lookup: {
        from: "bookingpricings",
        localField: "_id",
        foreignField: "bookingId",
        as: "pricing",
      },
    },
    // 4. Lookup utilities từ booking items
    {
      $lookup: {
        from: "utilities",
        localField: "items.utilitiesId",
        foreignField: "_id",
        as: "utilities",
      },
    },
    // 5. Project để tạo định dạng giống bill
    {
      $project: {
        totalRoomPrice: {
          $sum: "$pricing.calculatedAmount",
        },
        totalUtilitiesPrice: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $let: {
                  vars: {
                    utility: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$utilities",
                            cond: { $eq: ["$$this._id", "$$item.utilitiesId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    $multiply: [
                      "$$item.quantity",
                      { $ifNull: ["$$utility.price", 0] },
                    ],
                  },
                },
              },
            },
          },
        },
        roomName: "$room.name",
        createdAt: "$createdAt",
      },
    },
  ];

  const bookings = await Booking.aggregate(pipeline);
  return bookings;
}
export const getNote = async (bookingId: string): Promise<Note | null> => {
  const booking = await Booking.findById(bookingId).select("note");
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking");
  }

  if (!booking.note) {
    return null;
  }

  const note: Note = {
    Content: booking.note.Content,
    Discount: booking.note.Discount,
    PayInAdvance: booking.note.PayInAdvance,
    NegotiatedPrice: booking.note.NegotiatedPrice,
    BookingId: bookingId,
  };

  return note;
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
    amount: amount,
  };
};

export const moveRoom = async (bookingId: string, newRoomId: string) => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate Booking and Rooms
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw AppError.notFound("Không tìm thấy booking");
      }

      const oldRoom = await RoomModel.findById(booking.roomId).session(session);
      if (!oldRoom) {
        throw AppError.notFound("Không tìm thấy phòng hiện tại");
      }

      oldRoom.typeHire = 0;

      const newRoom = await RoomModel.findById(newRoomId).session(session);
      if (!newRoom) {
        throw AppError.notFound("Không tìm thấy phòng cần đổi");
      }

      if (!newRoom.status) {
        throw AppError.badRequest("Phòng cần đổi không khả dụng");
      }

      if (newRoomId === booking.roomId.toString()) {
        throw AppError.badRequest("Phòng mới phải khác phòng hiện tại");
      }

      if (newRoom.hotelId.toString() !== oldRoom.hotelId.toString()) {
        throw AppError.badRequest("Phòng mới phải thuộc cùng khách sạn");
      }

      const bookingPricing = await BookingPricing.findOne({
        bookingId,
      }).session(session);
      if (!bookingPricing) {
        throw AppError.notFound("Không tìm thấy thông tin giá cho booking");
      }

      const typedBookingPricing = bookingPricing as BookingPricingDocument;

      const typeHireMap: { [key: string]: number } = {
        HOUR: 1,
        NIGHT: 2,
        DAY: 3,
      };
      newRoom.typeHire = typeHireMap[typedBookingPricing.priceType] || 1;

      // 3. Update Booking and BookingPricing
      booking.roomId = newRoom._id;
      typedBookingPricing.roomId = newRoom._id;

      // 4. Recalculate Pricing for All History Records
      const updatedHistory: PricingHistory[] = [];
      for (const history of typedBookingPricing.history) {
        if (!history._id) continue;

        let updatedRecord: PricingHistory = { ...history };

        switch (history.priceType) {
          case "HOUR":
            updatedRecord = calculateHour(
              history,
              newRoom.originalPrice,
              newRoom.afterHoursPrice
            );
            break;

          case "NIGHT": {
            updatedRecord.amount = newRoom.nightPrice || 0;
            updatedRecord.appliedNightPrice = newRoom.nightPrice;
            break;
          }

          case "DAY":
            {
              updatedRecord.amount = newRoom.dayPrice || 0;
              updatedRecord.appliedDayPrice = newRoom.dayPrice;
            }
            break;

          default:
            throw new Error(`Unsupported priceType: ${history.priceType}`);
        }

        updatedHistory.push(updatedRecord);
      }

      // Cập nhật toàn bộ history
      typedBookingPricing.history = updatedHistory;

      // 5. Calculate Total Amount
      const totalHistory =
        typedBookingPricing.history?.reduce(
          (sum, h) => sum + (h.amount || 0),
          0
        ) || 0;

      const totalSurcharge =
        booking.surcharge?.reduce((sum, s) => sum + (s.Amount || 0), 0) || 0;
      const totalUtility =
        booking.items?.reduce(
          (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
          0
        ) || 0;
      let calculated = totalHistory + totalSurcharge + totalUtility;

      // Apply Discount and PayInAdvance
      if (booking.note?.Discount && booking.note.Discount > 0) {
        calculated -= booking.note.Discount;
      }
      if (booking.note?.PayInAdvance && booking.note.PayInAdvance > 0) {
        calculated -= booking.note.PayInAdvance;
      }

      if (booking.note?.NegotiatedPrice && booking.note.NegotiatedPrice > 0) {
        calculated = booking.note.NegotiatedPrice;
      }

      typedBookingPricing.calculatedAmount = Math.max(0, calculated);

      // 7. Save All Changes
      await oldRoom.save({ session });
      await newRoom.save({ session });
      await booking.save({ session });
      await typedBookingPricing.save({ session });

      // 8. Commit Transaction
      await session.commitTransaction();
      return { booking, bookingPricing: typedBookingPricing, oldRoom, newRoom };
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === "MongoServerError" && error.code === 112) {
        // WriteConflict
        retries++;
        if (retries >= MAX_RETRIES) {
          throw AppError.database(
            "Write conflict occurred after maximum retries",
            error
          );
        }
        continue; // Retry the transaction
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  throw AppError.database("Failed to execute transaction after retries");
};

export const changePriceType = async (
  bookingId: string,
  newPriceType: "HOUR" | "DAY" | "NIGHT"
) => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate Booking and BookingPricing
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw AppError.notFound("Không tìm thấy booking");
      }

      const bookingPricing = await BookingPricing.findOne({
        bookingId,
      }).session(session);
      if (!bookingPricing) {
        throw AppError.notFound("Không tìm thấy thông tin giá cho booking");
      }

      const typedBookingPricing = bookingPricing as BookingPricingDocument;
      const room = await RoomModel.findById(booking.roomId).session(session);
      if (!room) {
        throw AppError.notFound("Không tìm thấy phòng");
      }

      const currentTime = new Date();
      const noonToday = new Date(currentTime);
      noonToday.setHours(12, 0, 0, 0);

      // 2. Handle Price Type Change
      const latestHistory = typedBookingPricing.history
        .filter((h) => !h.appliedTo)
        .sort((a, b) => b.appliedFrom.getTime() - a.appliedFrom.getTime())[0];

      if (!latestHistory) {
        throw AppError.badRequest("Không tìm thấy lịch sử giá hiện tại");
      }

      // 3. Update amount for current history before changing type
      if (latestHistory._id) {
        await calculateAndUpdatePricing(
          typedBookingPricing._id.toString(),
          latestHistory._id.toString(),
          room._id.toString(),
          { session }
        );
      }

      const bookingPricingUpdated = await BookingPricing.findOne({
        bookingId,
      }).session(session);

      const typedBookingPricingUpdated =
        bookingPricingUpdated as BookingPricingDocument;

      const latestHistoryUpdated = typedBookingPricingUpdated.history
        .filter((h) => !h.appliedTo)
        .sort((a, b) => b.appliedFrom.getTime() - a.appliedFrom.getTime())[0];

      const typeHireMap: { [key: string]: number } = {
        HOUR: 1,
        NIGHT: 2,
        DAY: 3,
      };

      const histories = typedBookingPricingUpdated.history.sort(
        (a, b) => a.appliedFrom.getTime() - b.appliedFrom.getTime()
      );
      const lastIndex = histories.length - 1;
      const prevHistory = histories[lastIndex - 1];

      // 4. Process based on current and new price type
      if (latestHistoryUpdated.priceType === "HOUR" && newPriceType === "DAY") {
        // Close current hour history
        latestHistoryUpdated.appliedTo = currentTime;
        // Create new day history
        const newHistory: PricingHistory = {
          action: "CHANGE_TYPE",
          priceType: "DAY",
          amount: room.dayPrice || 0,
          appliedFrom: currentTime,
          appliedDayPrice: room.dayPrice,
        };
        typedBookingPricingUpdated.history.push(newHistory);
        room.typeHire = typeHireMap[newPriceType];
      } else if (
        latestHistoryUpdated.priceType === "HOUR" &&
        newPriceType === "NIGHT"
      ) {
        // Close current hour history
        latestHistoryUpdated.appliedTo = currentTime;

        // Create new night history
        const newHistory: PricingHistory = {
          action: "CHANGE_TYPE",
          priceType: "NIGHT",
          amount: room.nightPrice || 0,
          appliedFrom: currentTime,
          appliedNightPrice: room.nightPrice,
        };
        typedBookingPricingUpdated.history.push(newHistory);
        room.typeHire = typeHireMap[newPriceType];
      } else if (
        latestHistoryUpdated.priceType === "NIGHT" &&
        newPriceType === "DAY"
      ) {
        if (prevHistory && prevHistory.priceType === "DAY") {
          // Tính mốc 24h kể từ appliedFrom của prevHistory
          const appliedFrom = new Date(prevHistory.appliedFrom);
          const fullDayMark = new Date(appliedFrom);
          fullDayMark.setHours(fullDayMark.getHours() + 24);

          if (currentTime < fullDayMark) {
            // rollback: vẫn dùng DAY cũ

            // 1. Xóa bản ghi NIGHT hiện tại
            typedBookingPricingUpdated.history.splice(lastIndex, 1);

            // 3. Reset appliedTo của prevHistory (day) để tiếp tục tính
            prevHistory.appliedTo = undefined;
          }
        } else {
          // Đã đủ 24h → thực hiện logic chuyển sang DAY mới

          latestHistoryUpdated.priceType = "DAY";
          latestHistoryUpdated.appliedNightPrice = 0;
          latestHistoryUpdated.appliedDayPrice = room.dayPrice;
          latestHistoryUpdated.amount = room.dayPrice || 0;
        }
        room.typeHire = typeHireMap[newPriceType];
      } else if (
        latestHistoryUpdated.priceType === "NIGHT" &&
        newPriceType === "HOUR"
      ) {
        // Update night to hour
        const histories = typedBookingPricingUpdated.history.sort(
          (a, b) => a.appliedFrom.getTime() - b.appliedFrom.getTime()
        );
        const lastIndex = histories.length - 1;
        const prevHistory = histories[lastIndex - 1];

        if (prevHistory && prevHistory.priceType === "HOUR") {
          // 1. Khôi phục bản ghi giờ
          if (prevHistory.appliedTo) {
            const diffMs =
              currentTime.getTime() - prevHistory.appliedTo.getTime();
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            prevHistory.appliedTo = undefined;
            prevHistory.amount! += diffHours * (room.afterHoursPrice || 0);
          }

          // 3. Xóa bản ghi NIGHT hiện tại
          typedBookingPricingUpdated.history.splice(lastIndex, 1);
        } else {
          // Fallback: chuyển NIGHT → HOUR trực tiếp
          latestHistoryUpdated.priceType = "HOUR";
          latestHistoryUpdated.appliedNightPrice = 0;
          latestHistoryUpdated.appliedFirstHourPrice = room.originalPrice;
          latestHistoryUpdated.appliedNextHourPrice = room.afterHoursPrice;
        }

        room.typeHire = typeHireMap[newPriceType];
      } else if (
        latestHistoryUpdated.priceType === "DAY" &&
        newPriceType === "HOUR"
      ) {
        if (prevHistory && prevHistory.priceType === "HOUR") {
          // 1. Khôi phục lại bản ghi giờ
          if (prevHistory.appliedTo) {
            // Tính số giờ phát sinh từ appliedTo cũ đến hiện tại
            const diffMs =
              currentTime.getTime() - prevHistory.appliedTo.getTime();
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            prevHistory.appliedTo = undefined;
            // cộng thêm tiền giờ phát sinh
            prevHistory.amount! += diffHours * (room.afterHoursPrice || 0);
          }

          // 3. Xóa bản ghi ngày (latestHistoryUpdated)
          typedBookingPricingUpdated.history.splice(lastIndex, 1);
        } else {
          // Không có bản ghi giờ trước đó -> fallback về logic cũ
          latestHistoryUpdated.priceType = "HOUR";
          latestHistoryUpdated.appliedDayPrice = 0;
          latestHistoryUpdated.appliedFirstHourPrice = room.originalPrice;
          latestHistoryUpdated.appliedNextHourPrice = room.afterHoursPrice;
        }

        room.typeHire = typeHireMap[newPriceType];
      } else if (
        latestHistoryUpdated.priceType === "DAY" &&
        newPriceType === "NIGHT"
      ) {
        if (prevHistory && prevHistory.priceType === "NIGHT") {
          // Tính mốc 12h trưa tiếp theo kể từ appliedFrom của prevHistory
          const noonNextDay = new Date(prevHistory.appliedFrom);
          noonNextDay.setDate(noonNextDay.getDate() + 1);
          noonNextDay.setHours(12, 0, 0, 0);

          if (currentTime < noonNextDay) {
            // rollback: vẫn dùng NIGHT cũ

            // 1. Xóa bản ghi DAY hiện tại
            typedBookingPricingUpdated.history.splice(lastIndex, 1);

            // 3. Reset appliedTo của prevHistory (night) để tiếp tục tính
            prevHistory.appliedTo = undefined;
          }
        } else {
          // Đã qua 12h → thực hiện logic chuyển sang NIGHT mới
          latestHistoryUpdated.priceType = "NIGHT";
          latestHistoryUpdated.appliedDayPrice = 0;
          latestHistoryUpdated.appliedNightPrice = room.nightPrice;
        }
      } else {
        throw AppError.badRequest(
          "Loại giá không hợp lệ hoặc không cần thay đổi"
        );
      }

      // 5. Update amount for new history if needed (for HOUR type)
      const newHistory =
        typedBookingPricingUpdated.history[
          typedBookingPricingUpdated.history.length - 1
        ];

      // 6. Recalculate Total Amount
      const totalHistory = typedBookingPricingUpdated.history.reduce(
        (sum, h) => sum + (h.amount || 0),
        0
      );
      const totalSurcharge =
        booking.surcharge?.reduce((sum, s) => sum + (s.Amount || 0), 0) || 0;
      const totalUtility =
        booking.items?.reduce(
          (sum, u) => sum + (u.price || 0) * (u.quantity || 1),
          0
        ) || 0;
      let calculated = totalHistory + totalSurcharge + totalUtility;

      // Apply Discount and PayInAdvance
      if (booking.note?.Discount && booking.note.Discount > 0) {
        calculated -= booking.note.Discount;
      }
      if (booking.note?.PayInAdvance && booking.note.PayInAdvance > 0) {
        calculated -= booking.note.PayInAdvance;
      }
      if (booking.note?.NegotiatedPrice && booking.note.NegotiatedPrice > 0) {
        calculated = booking.note.NegotiatedPrice;
      }

      typedBookingPricingUpdated.calculatedAmount = Math.max(0, calculated);
      typedBookingPricingUpdated.priceType = newPriceType;

      // 7. Save All Changes
      await room.save({ session });
      await booking.save({ session });
      await typedBookingPricingUpdated.save({ session });

      // 8. Re-fetch BookingPricing to ensure updated data
      const updatedBookingPricing = await BookingPricing.findOne({
        bookingId,
      }).session(session);
      if (!updatedBookingPricing) {
        throw AppError.notFound(
          "Không tìm thấy thông tin giá sau khi cập nhật"
        );
      }

      // 9. Commit Transaction
      await session.commitTransaction();
      return { booking, bookingPricing: updatedBookingPricing, room };
    } catch (error: any) {
      await session.abortTransaction();
      if (error.name === "MongoServerError" && error.code === 112) {
        retries++;
        if (retries >= MAX_RETRIES) {
          throw AppError.database(
            "Write conflict occurred after maximum retries",
            error
          );
        }
        continue;
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  throw AppError.database("Failed to execute transaction after retries");
};
