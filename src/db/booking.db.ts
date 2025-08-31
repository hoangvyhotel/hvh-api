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

type UtilitiesForBooking = {
  Quantity: number;
  Icon: string;
};

export interface GetRoomsByHotel {
  HotelId: string;
  RoomName: string;
  Status: string;
  TypeBooking?: "Day" | "Hours" | "Night";
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
  console.log("// 1. Lấy tất cả phòng của khách sạn");
  const rooms: IRoomDocument[] = await RoomModel.find({
    hotelId: new mongoose.Types.ObjectId(id),
    status: true,
  });

  const roomIds = rooms.map((r) => new mongoose.Types.ObjectId(r._id));
  console.log("roomsId", roomIds);
  console.log("// 2. Lấy các booking đang CHECKIN");
  const bookings = await Booking.find({
    roomId: { $in: roomIds },
  });
  console.log("booings", bookings);
  console.log("// 3. Lấy BookingItem kèm thông tin utilities");
  const bookingIds = bookings.map((b) => b._id);
  const bookingItems =
    bookingIds.length > 0
      ? await BookingItem.find({ bookingId: { $in: bookingIds } }).populate<{
          utilitiesId: IUtility;
        }>("utilitiesId")
      : [];

  console.log("// 4. Map bookingId -> danh sách utilities");
  const bookingItemMap: Record<string, UtilitiesForBooking[]> = {};
  bookingItems.forEach((item) => {
    const bid = item.bookingId.toString();
    if (!bookingItemMap[bid]) bookingItemMap[bid] = [];

    bookingItemMap[bid].push({
      Quantity: item.quantity,
      Icon: item.utilitiesId?.icon || "",
    });
  });

  console.log(" // 5. Map roomId -> booking hiện tại");
  const bookingMap: Record<string, IBooking | undefined> = {};
  bookings.forEach((b) => {
    bookingMap[b.roomId.toString()] = b as IBooking;
  });

  console.log("// 6. Build dữ liệu theo interface GetRoomsByHotel");
  const data: GetRoomsByHotel[] = rooms.map((room) => {
    const booking = bookingMap[room._id.toString()];
    const typeBooking =
      room.typeHire === 1
        ? "Hours"
        : room.typeHire === 2
        ? "Night"
        : room.typeHire === 3
        ? "Day"
        : undefined;

    return {
      HotelId: id,
      RoomId: room._id.toString(),
      RoomName: room.name,
      Status: booking ? "CHECKIN" : "FREE",
      TypeBooking: typeBooking,
      Utilities: booking ? bookingItemMap[booking._id!.toString()] : undefined, // <- ! để chắc chắn không null
      Description: room.description,
      Floor: room.floor,
      Checkin: booking?.checkin,
    };
  });
  console.log("done");

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
  const currentDate = new Date(); // Thời gian hiện tại: 12:12 AM +07, 31/08/2025

  // 1. Lấy booking hiện tại dựa trên roomId
  console.log("roomId", roomId);
  const booking = await Booking.findOne({
    roomId: new Types.ObjectId(roomId),
  })
    .lean()
    .select("+documentInfo +carInfo +surcharge +note");

  if (!booking) {
    throw new Error("Không tìm thấy booking cho roomId này");
  }

  const bookingId = booking._id.toString();

  // 2. Lấy thông tin phòng để xác định typeHire
  const room = await RoomModel.findOne({
    _id: new Types.ObjectId(roomId),
  }).lean();

  if (!room) {
    throw new Error("Không tìm thấy phòng cho roomId này");
  }

  // 3. Lấy thông tin BookingPricing (chỉ lấy các bản ghi active và phù hợp với thời gian hiện tại)
  const bookingPricings = await BookingPricing.find({
    bookingId: new Types.ObjectId(bookingId),
    isActive: true,
    startTime: { $lte: currentDate },
    $or: [{ endTime: { $gte: currentDate } }, { endTime: null }],
  }).lean();

  // 4. Lấy BookingItem và populate Utilities
  const bookingItems = await BookingItem.find({
    bookingId: new Types.ObjectId(bookingId),
  })
    .populate<{ utilitiesId: IUtility }>("utilitiesId")
    .lean();

  // 5. Map bookingId -> danh sách Utilities
  const utilities: UtilitiesForBooking[] = bookingItems.map((item) => ({
    Quantity: item.quantity,
    Icon: item.utilitiesId?.icon || "",
  }));

  // 6. Lấy Documents và CarInfos trực tiếp từ booking
  const documents: Document[] =
    booking.documentInfo?.map((doc: any) => ({
      ID: doc.ID || "",
      TypeID: doc.TypeID || "CCCD",
      FullName: doc.FullName || "",
      Address: doc.Address || "",
      BirthDay: doc.BirthDay || "",
      Gender: doc.Gender || false,
      EthnicGroup: doc.EthnicGroup || "",
    })) || [];

  const carInfos: CarInfo[] =
    booking.carInfo?.map((car: any) => ({
      LicensePlate: car.LicensePlate || "",
    })) || [];

  // 7. Lấy Surcharges và Notes trực tiếp từ booking
  const surcharges: Surcharge[] =
    booking.surcharge?.map((surch: any) => ({
      Content: surch.Content || "",
      Amout: surch.Amout || 0,
    })) || [];

  const notes: Note[] =
    booking.note?.map((note: any) => ({
      Content: note.Content || "",
      Discount: note.Discount || 0,
      PayInAdvance: note.PayInAdvance || 0,
      NegotiatedPrice: note.NegotiatedPrice || 0,
    })) || [];

  // 8. Xác định TypeBooking dựa trên typeHire của phòng, ưu tiên BookingPricing nếu có
  let typeBooking: string | undefined;
  if (bookingPricings.length > 0) {
    // Ưu tiên lấy từ BookingPricing active
    typeBooking =
      bookingPricings[0].priceType === "HOUR"
        ? "Hours"
        : bookingPricings[0].priceType === "DAY"
        ? "Day"
        : bookingPricings[0].priceType === "NIGHT"
        ? "Night"
        : undefined;
  } else if (room.typeHire) {
    // Nếu không có BookingPricing, lấy từ typeHire của phòng
    typeBooking =
      room.typeHire === 1
        ? "Hours"
        : room.typeHire === 2
        ? "Night"
        : room.typeHire === 3
        ? "Day"
        : undefined;
  } else {
    typeBooking = "Hours"; // Giá trị mặc định nếu không xác định được
  }

  // 9. Xây dựng response theo interface GetBookingInfo
  const response: GetBookingInfo = {
    BookingId: bookingId,
    RoomName: room.name || "Unknown Room", // Lấy RoomName từ room
    TypeBooking: typeBooking || "Hours",
    Surcharge: surcharges,
    Notes: notes,
    Utilities: utilities,
    Documents: documents,
    CarInfos: carInfos,
    BookingPricing: bookingPricings.map((bp) => ({
      PriceType: bp.priceType,
      StartDate: bp.startTime.toISOString(),
      EndDate: bp.endTime?.toISOString(),
      AppliedFirstHourPrice: bp.appliedFirstHourPrice,
      AppliedNextHourPrice: bp.appliedNextHourPrice,
      AppliedDayPrice: bp.appliedDayPrice,
      AppliedNightPrice: bp.appliedNightPrice,
      CalculatedAmount: bp.calculatedAmount,
    })),
  };

  console.log("done");
  return response;
};
