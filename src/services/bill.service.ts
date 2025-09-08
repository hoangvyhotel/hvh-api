import * as db from "@/db/bill.db";
import { AppError } from "@/utils/AppError";
import { RoomModel } from "@/models/Room";
import { Types } from "mongoose";
import { CreateBillRequest } from "@/types/request/bill/CreateBillRequest.type";
import { UpdateBillRequest } from "@/types/request/bill/UpdateBillRequest.type";
import { IBill } from "@/models/Bill";
import * as bookingDb from "@/db/booking.db";
import * as bookingPrincingDb from "@/db/booking-princing.db";
import { ParamsRequest } from "@/types/request";
import { changeRoomToAvailable } from "./room.service";
import { getRoomsByHotelId } from "@/db/room.db";

export class BillService {
  async getDailyTotals(month: number, year?: number, hotelId?: string) {
    if (typeof month !== "number") {
      throw AppError.badRequest("Tham số tháng phải là số");
    }
    if (month < 1 || month > 12) {
      throw AppError.badRequest("Tham số tháng phải nằm trong 1..12");
    }

    const y = typeof year === "number" ? year : new Date().getFullYear();

    // compute date range
    const start = new Date(y, month - 1, 1);
    const end = new Date(y, month, 1);

    // If hotelId provided, fetch rooms for the hotel and build set of roomId strings
    let roomIdSet: Set<string> | null = null;
    if (hotelId) {
      const hotelIdCandidates: any[] = [];
      if (Types.ObjectId.isValid(hotelId)) {
        hotelIdCandidates.push(new Types.ObjectId(hotelId));
      }
      // also allow string match
      hotelIdCandidates.push(hotelId);

      const rooms = await RoomModel.find(
        { hotelId: { $in: hotelIdCandidates } },
        { _id: 1 }
      ).lean();
      const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
      roomIdSet = new Set<string>(roomIds.map((id: any) => id.toString()));
      // if no rooms, return empty days
      if (roomIds.length === 0) {
        const daysInMonthEmpty = new Date(y, month, 0).getDate();
        const now = new Date();
        let lastDayEmpty = daysInMonthEmpty;
        if (y === now.getFullYear() && month === now.getMonth() + 1)
          lastDayEmpty = Math.min(daysInMonthEmpty, now.getDate());
        const itemsEmpty = [] as Array<{
          day: number;
          totalRoom: number;
          totalUtilities: number;
        }>;
        for (let d = 1; d <= lastDayEmpty; d++)
          itemsEmpty.push({ day: d, totalRoom: 0, totalUtilities: 0 });
        return { items: itemsEmpty };
      }
    }

    // fetch bills for the month (no hotel filtering) then filter client-side by roomId string
    const rawBills: any[] = await db.getBillsForMonth(month, y);

    // build a map day -> totals
    const daysInMonth = new Date(y, month, 0).getDate();
    const now = new Date();
    let lastDay = daysInMonth;
    if (y === now.getFullYear() && month === now.getMonth() + 1)
      lastDay = Math.min(daysInMonth, now.getDate());

    const map = new Map<
      number,
      { totalRoom: number; totalUtilities: number }
    >();

    for (const b of rawBills) {
      const created = (b as any).createdAt
        ? new Date((b as any).createdAt)
        : null;
      if (!created) continue;
      if (created < start || created >= end) continue; // ensure within month
      const roomId = (b as any).roomId ? (b as any).roomId.toString() : null;
      if (roomIdSet && !roomId) continue;
      if (roomIdSet && !roomIdSet.has(roomId)) continue; // not a bill for this hotel's rooms

      const day = created.getDate();
      if (day < 1 || day > daysInMonth) continue;
      const room = Number(
        (b as any).totalRoomPrice ?? (b as any).totalRoom ?? 0
      );
      const util = Number(
        (b as any).totalUtilitiesPrice ?? (b as any).totalUtilities ?? 0
      );
      const prev = map.get(day);
      if (prev) {
        prev.totalRoom += room;
        prev.totalUtilities += util;
      } else {
        map.set(day, { totalRoom: room, totalUtilities: util });
      }
    }

    // weekday names in Vietnamese (0 = Sunday)
    const WEEK_DAYS_VN = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];

    const items: Array<{
      day: number;
      weekday: string;
      totalRoom: number;
      totalUtilities: number;
      total: number;
    }> = [];
    for (let d = 1; d <= lastDay; d++) {
      const v = map.get(d) || { totalRoom: 0, totalUtilities: 0 };
      const dt = new Date(y, month - 1, d);
      const weekday = WEEK_DAYS_VN[dt.getDay()] || "";
      items.push({
        day: d,
        weekday,
        totalRoom: v.totalRoom,
        totalUtilities: v.totalUtilities,
        total: Number(v.totalRoom) + Number(v.totalUtilities),
      });
    }

    return { items };
  }

  /**
   * Tính tổng doanh thu theo tháng (tổng tiền phòng + tổng tiền tiện ích).
   * Trả về dạng: { totals: { totalRoom, totalUtilities, total } }
   * Không tính các hoá đơn trong tương lai (nếu month/year là tháng hiện tại chỉ tính đến hôm nay).
   */
  async getMonthlyTotal(month: number, year?: number, hotelId?: string) {
    // Validate month
    if (!Number.isInteger(month)) {
      throw AppError.badRequest(
        "Tham số 'month' phải là số nguyên (1-12)",
        "INVALID_MONTH"
      );
    }
    if (month < 1 || month > 12) {
      throw AppError.badRequest(
        "Tham số 'month' phải nằm trong 1..12",
        "INVALID_MONTH"
      );
    }

    const y = typeof year === "number" ? year : new Date().getFullYear();

    const start = new Date(y, month - 1, 1);
    const end = new Date(y, month, 1);

    // prepare roomIdSet if hotelId provided (same logic as daily)
    let roomIdSet: Set<string> | null = null;
    if (hotelId) {
      const hotelIdCandidates: any[] = [];
      if (Types.ObjectId.isValid(hotelId)) {
        hotelIdCandidates.push(new Types.ObjectId(hotelId));
      }
      hotelIdCandidates.push(hotelId);
      const rooms = await RoomModel.find(
        { hotelId: { $in: hotelIdCandidates } },
        { _id: 1 }
      ).lean();
      const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
      if (roomIds.length === 0)
        return { totals: { totalRoom: 0, totalUtilities: 0, total: 0 } };
      roomIdSet = new Set<string>(roomIds.map((id: any) => id.toString()));
    }

    // fetch raw bills and sum
    const rawBills: any[] = await db.getBillsForMonth(month, y);
    let totalRoom = 0;
    let totalUtilities = 0;
    const now = new Date();

    for (const b of rawBills) {
      const created = (b as any).createdAt
        ? new Date((b as any).createdAt)
        : null;
      if (!created) continue;
      if (created < start || created >= end) continue;
      // skip future-dated bills in current month
      if (
        y === now.getFullYear() &&
        month === now.getMonth() + 1 &&
        created > now
      )
        continue;
      const roomId = (b as any).roomId ? (b as any).roomId.toString() : null;
      if (roomIdSet && !roomIdSet.has(roomId)) continue;
      totalRoom += Number(
        (b as any).totalRoomPrice ?? (b as any).totalRoom ?? 0
      );
      totalUtilities += Number(
        (b as any).totalUtilitiesPrice ?? (b as any).totalUtilities ?? 0
      );
    }

    const total = totalRoom + totalUtilities;
    return { totals: { totalRoom, totalUtilities, total } };
  }

  // CRUD helpers
  // async createBill(req: ParamsRequest<{ roomId: string }>) {
  //   const roomId = req.params.roomId;
  //   if (!roomId) {
  //     throw AppError.badRequest("roomId is required");
  //   }

  //   // Validate roomId format
  //   if (!Types.ObjectId.isValid(roomId)) {
  //     throw AppError.badRequest("roomId không hợp lệ");
  //   }

  //   // Get booking information from roomId
  //   const bookingInfo = await bookingDb.getBookingInfo(req);

  //   if (!bookingInfo) {
  //     throw AppError.notFound("Không tìm thấy thông tin booking cho phòng này");
  //   }

  //   // Calculate total room price from booking pricing
  //   let totalRoomPrice = 0;
  //   if (bookingInfo.BookingPricing && bookingInfo.BookingPricing.length > 0) {
  //     totalRoomPrice = bookingInfo.BookingPricing.reduce((sum, pricing) => {
  //       return sum + (pricing.CalculatedAmount || 0);
  //     }, 0);
  //   }

  //   // Calculate total utilities price
  //   let totalUtilitiesPrice = 0;
  //   if (bookingInfo.Utilities && bookingInfo.Utilities.length > 0) {
  //     totalUtilitiesPrice = bookingInfo.Utilities.reduce((sum, util) => {
  //       const price = util.Price || 0;
  //       return sum + util.Quantity * price;
  //     }, 0);
  //   }

  //   const hotelId = await getHotelIdByRoomId(roomId);

  //   const billToSave: IBill = {
  //     roomId: new Types.ObjectId(roomId),
  //     hotelId: new Types.ObjectId(hotelId),
  //     totalRoomPrice,
  //     totalUtilitiesPrice,
  //   } as IBill;

  //   // Save bill to database
  //   const savedBill = await db.createBill(billToSave);

  //   // Lưu xong bill. xóa booking và booking pricing, cập nhật lại trạng thái phòng
  //   await bookingDb.deleteBooking(bookingInfo.BookingId.toString());
  //   await bookingPrincingDb.deleteBookingPricing(
  //     bookingInfo.BookingId.toString()
  //   );

  //   // reset room status to 'available'
  //   await changeRoomToAvailable(roomId);

  //   return savedBill;
  // }

  async getBill(id: string) {
    if (!id) throw AppError.badRequest("Id is required");
    const bill = await db.getBillById(id);
    if (!bill) throw AppError.notFound("Bill not found");
    return bill;
  }

  async updateBill(id: string, update: UpdateBillRequest) {
    if (!id) throw AppError.badRequest("Id là bắt buộc");
    if (!update || Object.keys(update).length === 0)
      throw AppError.badRequest("Dữ liệu cập nhật không được để trống");
    if (
      update.totalRoomPrice != null &&
      typeof update.totalRoomPrice !== "number"
    ) {
      throw AppError.badRequest("totalRoomPrice phải là số");
    }
    if (
      update.totalUtilitiesPrice != null &&
      typeof update.totalUtilitiesPrice !== "number"
    ) {
      throw AppError.badRequest("totalUtilitiesPrice phải là số");
    }

    const toUpdate: any = { ...update };
    if (toUpdate.createdAt)
      toUpdate.createdAt = new Date(toUpdate.createdAt as any);

    const bill = await db.updateBillById(id, toUpdate);
    if (!bill) throw AppError.notFound("Bill not found");
    return bill;
  }

  async deleteBill(id: string) {
    if (!id) throw AppError.badRequest("Id is required");
    const bill = await db.deleteBillById(id);
    if (!bill) throw AppError.notFound("Bill not found");
    return bill;
  }

  async listBills(hotelId?: string) {
    if (!hotelId) {
      throw AppError.badRequest("hotelId is required");
    }

    if (!Types.ObjectId.isValid(hotelId)) {
      throw AppError.badRequest("hotelId không hợp lệ");
    }

    const rooms = await getRoomsByHotelId(hotelId);
    const bookingRooms = rooms.filter((room) => room.typeHire > 0);
    const bookingRoomIds = bookingRooms.map((room) => room.id.toString());

    // Lấy cả bookings (đang diễn ra) và bills (đã thanh toán)
    const [bookings, bills] = await Promise.all([
      bookingDb.getBookingsByRoomIds(bookingRoomIds),
      db.getBillsByHotelId(hotelId),
    ]);

    // Gộp bookings và bills thành một mảng
    // Thêm field 'type' để phân biệt
    const bookingsWithType = bookings.map((booking: any) => ({
      ...booking,
    }));

    const billsWithType = bills.map((bill: any) => ({
      ...bill,
    }));

    // Gộp lại và sắp xếp theo thời gian tạo (mới nhất trước)
    const allRecords = [...bookingsWithType, ...billsWithType].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allRecords;
  }
}
