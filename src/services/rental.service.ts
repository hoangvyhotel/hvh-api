import * as db from "@/db/rental.db";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";

const isPastDate = (date: Date) => {
  const now = new Date();
  return date < now;
};

export class RentalService {
  async getAllRentals() {
    return db.getAllRentals();
  }

  async getRentalById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Hóa đơn thuê không hợp lệ!");
    }
    const rental = await db.getRentalById(id);
    if (!rental) {
      throw AppError.notFound("Hóa đơn thuê không tồn tại!");
    }
    return rental;
  }

  async createRental(data: {
    enterTime: Date;
    leaveTime?: Date;
    totalRoomPrice: number;
    totalUtilitiesPrice: number;
    extraFee?: number;
    roomId: string;
  }) {
    if (!Types.ObjectId.isValid(data.roomId)) {
      throw AppError.badRequest("Phòng không hợp lệ!");
    }

    // valudate enterTime
    if (!isPastDate(data.enterTime)) {
      throw AppError.badRequest("Thời gian vào phòng không thể trong quá khứ!");
    }

    const totalPrice =
      data.totalRoomPrice + data.totalUtilitiesPrice + (data.extraFee || 0);

    return db.createRental({
      enterTime: data.enterTime,
      leaveTime: data.leaveTime,
      totalRoomPrice: data.totalRoomPrice,
      totalUtilitiesPrice: data.totalUtilitiesPrice,
      totalPrice,
      roomId: new Types.ObjectId(data.roomId),
    });
  }

  async updateRental(
    id: string,
    data: {
      enterTime: Date;
      leaveTime: Date;
      totalRoomPrice: number;
      totalUtilitiesPrice: number;
      extraFee?: number;
      roomId: string;
    }
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Hóa đơn thuê không hợp lệ!");
    }
    if (!Types.ObjectId.isValid(data.roomId)) {
      throw AppError.badRequest("Phòng không hợp lệ!");
    }

    if (!isPastDate(data.enterTime)) {
      throw AppError.badRequest("Thời gian vào phòng không thể trong quá khứ!");
    }
    if (!isPastDate(data.leaveTime)) {
      throw AppError.badRequest("Thời gian ra phòng không thể trong quá khứ!");
    }
    if (data.leaveTime < data.enterTime) {
      throw AppError.badRequest(
        "Thời gian ra phòng không thể trước thời gian vào phòng!"
      );
    }

    const totalPrice =
      data.totalRoomPrice + data.totalUtilitiesPrice + (data.extraFee || 0);

    return db.updateRental(id, {
      enterTime: data.enterTime,
      leaveTime: data.leaveTime,
      totalRoomPrice: data.totalRoomPrice,
      totalUtilitiesPrice: data.totalUtilitiesPrice,
      totalPrice,
      roomId: data.roomId,
    });
  }

  async deleteRental(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Hóa đơn thuê không hợp lệ!");
    }
    return db.deleteRental(id);
  }

  async getDailyTotals(month: number, year?: number, hotelId?: string) {
    if (typeof month !== "number") {
      throw AppError.badRequest("Tham số tháng phải là số");
    }
    if (month < 1 || month > 12) {
      throw AppError.badRequest("Tham số tháng phải nằm trong 1..12");
    }

    const y = typeof year === "number" ? year : new Date().getFullYear();
    const bills = await db.getBillsForMonth(month, y, hotelId);

    // Số ngày của tháng
    const daysInMonth = new Date(y, month, 0).getDate();

    const map = new Map<
      number,
      { totalRoom: number; totalUtilities: number }
    >();

    for (const b of bills) {
      const created = (b as any).createdAt
        ? new Date((b as any).createdAt)
        : null;
      if (!created) continue;
      const day = created.getDate();
      const room = Number((b as any).totalRoomPrice || 0);
      const util = Number((b as any).totalUtilitiesPrice || 0);

      const prev = map.get(day);
      if (prev) {
        prev.totalRoom += room;
        prev.totalUtilities += util;
      } else {
        map.set(day, { totalRoom: room, totalUtilities: util });
      }
    }

    const items: Array<{
      day: number;
      totalRoom: number;
      totalUtilities: number;
    }> = [];

    // Không trả về ngày trong tương lai: nếu month/year là tháng hiện tại, giới hạn đến ngày hôm nay
    const now = new Date();
    let lastDay = daysInMonth;
    if (y === now.getFullYear() && month === now.getMonth() + 1) {
      lastDay = Math.min(daysInMonth, now.getDate());
    }

    for (let d = 1; d <= lastDay; d++) {
      const v = map.get(d);
      items.push({
        day: d,
        totalRoom: v ? v.totalRoom : 0,
        totalUtilities: v ? v.totalUtilities : 0,
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
    const bills = await db.getBillsForMonth(month, y, hotelId);

    let totalRoom = 0;
    let totalUtilities = 0;

    const now = new Date();
    const isCurrentMonth =
      y === now.getFullYear() && month === now.getMonth() + 1;

    for (const b of bills) {
      const created = (b as any).createdAt
        ? new Date((b as any).createdAt)
        : null;
      if (!created) continue;
      if (isCurrentMonth && created > now) continue; // skip future-dated bills

      totalRoom += Number((b as any).totalRoomPrice || 0);
      totalUtilities += Number((b as any).totalUtilitiesPrice || 0);
    }

    const total = totalRoom + totalUtilities;
    return { totals: { totalRoom, totalUtilities, total } };
  }
}
