import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
} from "@/types/request";
import {
  BookingItemResponse,
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
  Note,
  Surcharge,
} from "@/types/response/booking";
import * as bookingDb from "../db/booking.db";
import { ResponseHelper } from "@/utils/response";
import { BaseResponse } from "@/types/response";
import * as bookingPrincingDb from "../db/booking-princing.db";
import * as roomDb from "../db/room-prisma.db";
import * as utilityDb from "../db/utility.db";
import { AppError } from "@/utils/AppError";
import { RoomModel } from "@/models/Room";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();
export interface BookingPricingData {
  bookingId: number;
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
  const { roomId, type } = req.body;

  if (!["HOUR", "DAY", "NIGHT"].includes(type)) {
    throw AppError.badRequest("Loại booking không hợp lệ");
  }

  try {
    // Dùng Prisma transaction
    await prisma.$transaction(async (tx) => {
      const room = await roomDb.getRoom(roomId); // truyền tx nếu cần

      if (room.typeHire !== 0) {
        throw AppError.conflict("Phòng đang được booking");
      }

      const pricingMap: Record<string, { amount: number; typeHire: number }> = {
        HOUR: { amount: room.originalPrice, typeHire: 1 },
        DAY: { amount: room.dayPrice, typeHire: 3 },
        NIGHT: { amount: room.nightPrice, typeHire: 2 },
      };

      const { amount, typeHire } = pricingMap[type];

      // Gọi hàm AddBooking có hỗ trợ transaction
      const bookingAdded = await bookingDb.AddBooking(roomId);

      await bookingPrincingDb.createBookingPricing(
        {
          bookingId: Number(bookingAdded.id),
          priceType: type as "HOUR" | "DAY" | "NIGHT",
          startTime: bookingAdded.createdAt!,
          amount,
        }        
      );

      await roomDb.updateTypeHireRoom(roomId, typeHire);
    });

    return ResponseHelper.success(null, "Tạo booking thành công");
  } catch (error) {
    throw error instanceof AppError
      ? error
      : AppError.internal("Lỗi khi tạo booking");
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
  if (!data.BookingId) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }
  await bookingDb.addSurcharge({
    BookingId: data.BookingId!, // dùng "!" để khẳng định không undefined
    Content: data.Content!,
    Amount: data.Amount!,
  });

  return ResponseHelper.success(null, "Thêm phụ thu thành công");
};

export const AddNote = async (
  req: AuthenticatedRequest<{ id: string }, Note>
): Promise<BaseResponse<null>> => {
  const data = req.body;
  const { id } = req.params;
  if (!id) {
    throw AppError.badRequest("ID phòng không hợp lệ");
  }

  await bookingDb.addNote(id, data);
  return ResponseHelper.success(null, "Thêm thành công");
};

export const AddUtility = async (
  req: BodyRequest<{ utilityId: string; bookingId: string; quantity?: number }>
): Promise<BaseResponse<null>> => {
  const { utilityId, bookingId, quantity = 1 } = req.body;

  if (!utilityId || !bookingId) {
    throw AppError.badRequest("Thiếu utilityId hoặc bookingId");
  }

  // 1. Kiểm tra booking có tồn tại không
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
  });
  if (!booking) {
    throw AppError.notFound("Không tìm thấy booking");
  }

  // 2. Kiểm tra utility có tồn tại không
  const utility = await prisma.utility.findUnique({
    where: { id: Number(utilityId) },
  });
  if (!utility) {
    throw AppError.notFound("Không tìm thấy dịch vụ/tiện ích");
  }

  // 3. Kiểm tra xem utility đã tồn tại trong booking chưa
  const existingItem = await prisma.bookingItem.findFirst({
    where: {
      bookingId: Number(bookingId),
      utilitiesId: Number(utilityId),
    },
  });

  if (existingItem) {
    // Nếu tồn tại -> cộng thêm quantity
    await prisma.bookingItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        price: utility.price, // luôn giữ giá hiện tại
        name: utility.name,
      },
    });
  } else {
    // Nếu chưa tồn tại -> tạo mới
    await prisma.bookingItem.create({
      data: {
        bookingId: Number(bookingId),
        utilitiesId: Number(utilityId),
        quantity,
        price: utility.price,
        name: utility.name,
      },
    });
  }

  return ResponseHelper.success(null, "Thêm tiện ích thành công");
};


export const RemoveUtilityService = async (
  req: BodyRequest<{ bookingId: string; utilityId: string; quantity?: number }>
): Promise<BaseResponse<null>> => {
  const { bookingId, utilityId, quantity = 1 } = req.body;
  console.log(req.body);

  try {
    await bookingDb.removeUtility(bookingId, Number(utilityId), quantity);
    return ResponseHelper.success(null, "Xóa/giảm tiện ích thành công");
  } catch (error: any) {
    throw AppError.internal(error?.message || "Xảy ra lỗi khi xóa tiện ích");
  }
};

  export const removeBooking = async (
    req: ParamsRequest<{ id: string }>
  ): Promise<BaseResponse<null>> => {
    const { id } = req.params;
    try {
      await bookingDb.deleteBooking(Number(id));
      return ResponseHelper.success(null, "Hủy phòng thành công");
    } catch (error: any) {
      throw AppError.internal(error?.message || "Xảy ra lỗi khi hủy phòng");
    }
  };
export const getBookings = async (): Promise<any> => {
  const bookings = await bookingDb.getBookings();
  return ResponseHelper.success(bookings, "Lấy danh sách booking thành công");
};

// Implementation hoàn chỉnh cho getRentalBookings
export const getRentalBookings = async (): Promise<BaseResponse<BookingItemResponse[]>> => {
  const bookings = await bookingDb.getBookings();

  const bookingItems: BookingItemResponse[] = await Promise.all(
    bookings.map(async (booking) => {
      const room = booking.room;
      if (!room) {
        throw AppError.internal("Không tìm thấy thông tin phòng cho booking này");
      }

      const checkin = booking.checkin;

      // Chuyển null checkout thành undefined
      const checkout = booking.checkout ?? undefined;

      // Tính tổng tiền utilities
      let utilitiesPrice = 0;
      if (booking.items && booking.items.length > 0) {
        const utilitiesPromises = booking.items.map(async (item) => {
          try {
            const utility = await utilityDb.getUtilityById(item.utilitiesId.toString());
            if (utility?.price && item.quantity) {
              return utility.price * item.quantity;
            }
            return 0;
          } catch (error) {
            console.error("Lỗi khi lấy utility:", error);
            return 0;
          }
        });

        const utilitiesPrices = await Promise.all(utilitiesPromises);
        utilitiesPrice = utilitiesPrices.reduce((total, price) => total + price, 0);
      }

      const roomPrice = room.originalPrice ?? 0;
      const isCheckout = !!checkout;

      return {
        roomName: room.name,
        checkin,
        checkout, // giờ là Date | undefined
        utilitiesPrice,
        roomPrice,
        isCheckout,
      };
    })
  );

  return ResponseHelper.success(bookingItems, "Lấy danh sách booking thành công");
};



export const getNoteByBooking = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<Note | null>> => {
  const { id } = req.params;

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
  await bookingDb.moveRoom(bookingId, newRoomId);
  return ResponseHelper.success(null, "Đổi phòng thành công");
};

export const addDocumentInfo = async (
  req: BodyRequest<{
    bookingId: string;
    ID: string;
    TypeID?: string;
    TypeId?: string;
    FullName: string;
    Address?: string;
    BirthDay?: string;
    Gender?: boolean;
    EthnicGroup?: string;
  }>
): Promise<BaseResponse<null>> => {
  const {
    bookingId,
    ID,
    TypeID,
    FullName,
    Address,
    BirthDay,
    Gender,
    EthnicGroup,
  } = req.body;

  // Normalize TypeID (accept TypeID or TypeId)
  const normalizedTypeID = TypeID ?? (req.body as any).TypeId ?? undefined;

  await bookingDb.addDocumentInfo(bookingId, {
    ID,
    TypeID: normalizedTypeID,
    FullName,
    Address,
    BirthDay,
    Gender,
    EthnicGroup,
  });

  return ResponseHelper.success(null, "Lưu thông tin giấy tờ thành công");
};

export const addCarInfoService = async (
  req: BodyRequest<{
    bookingId: string;
    LicensePlate: string;
    Color?: string;
    VehicleType?: string;
  }>
): Promise<BaseResponse<null>> => {
  const { bookingId, LicensePlate, Color, VehicleType } = req.body;

  await bookingDb.addCarInfo(bookingId, {
    LicensePlate,
    Color,
    VehicleType,
  });

  return ResponseHelper.success(null, "Lưu thông tin xe thành công");
};

export const getDocumentInfoService = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<any[]>> => {
  const { id } = req.params;
  const docs = await bookingDb.getDocumentInfo(id);
  return ResponseHelper.success(docs, "Lấy thông tin giấy tờ thành công");
};

export const getCarInfoService = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<any[]>> => {
  const { id } = req.params;
  const cars = await bookingDb.getCarInfo(id);
  return ResponseHelper.success(cars, "Lấy thông tin xe thành công");
};

export const updateDocumentInfoService = async (
  req: BodyRequest<{
    bookingId: string;
    docId: string; // using ID field as identifier
    updates: Partial<{
      ID: string;
      TypeID?: string;
      FullName?: string;
      Address?: string;
      BirthDay?: string;
      Gender?: boolean;
      EthnicGroup?: string;
    }>;
  }>
): Promise<BaseResponse<any>> => {
  const { bookingId, docId, updates } = req.body;
  if (!bookingId) throw AppError.badRequest("ID booking không hợp lệ");

  const updated = await bookingDb.updateDocumentInfo(
    bookingId,
    docId,
    updates as any
  );
  return ResponseHelper.success(
    updated,
    "Cập nhật thông tin giấy tờ thành công"
  );
};

export const updateCarInfoService = async (
  req: BodyRequest<{
    bookingId: string;
    licensePlate: string;
    updates: Partial<{
      LicensePlate: string;
      Color?: string;
      VehicleType?: string;
    }>;
  }>
): Promise<BaseResponse<any>> => {
  const { bookingId, licensePlate, updates } = req.body;
  if (!bookingId) throw AppError.badRequest("ID booking không hợp lệ");

  const updated = await bookingDb.updateCarInfo(
    bookingId,
    licensePlate,
    updates as any
  );
  return ResponseHelper.success(updated, "Cập nhật thông tin xe thành công");
};
