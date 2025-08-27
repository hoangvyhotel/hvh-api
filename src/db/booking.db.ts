import mongoose, { Types } from "mongoose";
import { RoomModel, IRoomDocument } from "@/models/Room";
import Booking, { IBooking } from "@/models/Booking";
import BookingItem from "@/models/BookingItem";
import { IUtility } from "@/models/Utility";
import { ParamsRequest } from "@/types/request/base";
import { BaseResponse } from "@/types/response";
import { ResponseHelper } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import {
  CarInfo,
  Document,
  GetBookingInfo,
  Note,
  Surcharge,
} from "@/types/response/booking";
import BookingPricing from "@/models/BookingPricing";
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

export const getBookings = async (): Promise<BaseResponse<IBooking[]>> => {
  const bookings = await Booking.find({});
  return ResponseHelper.success(bookings);
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
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking!");
  }

  const bookingPricing = await BookingPricing.findOne({
    bookingId: bookingId,
  });
  if (!bookingPricing) {
    throw AppError.notFound("Không tìm thấy thông tin giá cho booking!");
  }

  // Gán note vào booking (overwrite vì chỉ có 1 note duy nhất)
  booking.note = note;
  await booking.save();

  // Tính toán lại calculatedAmount
  let calculated = bookingPricing.calculatedAmount || 0;
  console.log("gia", calculated);
  if (note.NegotiatedPrice && note.NegotiatedPrice > 0) {
    // Nếu có giá thương lượng thì dùng luôn
    calculated = note.NegotiatedPrice;
  } else {
    if (note.Discount && note.Discount > 0) {
      calculated -= note.Discount;
    }
    if (note.PayInAdvance && note.PayInAdvance > 0) {
      calculated -= note.PayInAdvance;
    }
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

  // Cập nhật tổng tiền
  bookingPricing.calculatedAmount =
    (bookingPricing.calculatedAmount || 0) + utility.price * quantity;

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
