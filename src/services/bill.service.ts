
import * as db from "@/db/bill.db";
import { AppError } from "@/utils/AppError";
import { RoomModel } from "@/models/Room";
import { Types } from "mongoose";

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

		const rooms = await RoomModel.find({ hotelId: { $in: hotelIdCandidates } }, { _id: 1 }).lean();
		const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
		roomIdSet = new Set<string>(roomIds.map((id: any) => id.toString()));
		// if no rooms, return empty days
		if (roomIds.length === 0) {
			const daysInMonthEmpty = new Date(y, month, 0).getDate();
			const now = new Date();
			let lastDayEmpty = daysInMonthEmpty;
			if (y === now.getFullYear() && month === now.getMonth() + 1) lastDayEmpty = Math.min(daysInMonthEmpty, now.getDate());
			const itemsEmpty = [] as Array<{ day: number; totalRoom: number; totalUtilities: number }>;
			for (let d = 1; d <= lastDayEmpty; d++) itemsEmpty.push({ day: d, totalRoom: 0, totalUtilities: 0 });
			return { items: itemsEmpty };
		}
	}

	// fetch bills for the month (no hotel filtering) then filter client-side by roomId string
	const rawBills: any[] = await db.getBillsForMonth(month, y);

	// build a map day -> totals
	const daysInMonth = new Date(y, month, 0).getDate();
	const now = new Date();
	let lastDay = daysInMonth;
	if (y === now.getFullYear() && month === now.getMonth() + 1) lastDay = Math.min(daysInMonth, now.getDate());

	const map = new Map<number, { totalRoom: number; totalUtilities: number }>();

	for (const b of rawBills) {
		const created = (b as any).createdAt ? new Date((b as any).createdAt) : null;
		if (!created) continue;
		if (created < start || created >= end) continue; // ensure within month
		const roomId = (b as any).roomId ? (b as any).roomId.toString() : null;
		if (roomIdSet && !roomId) continue;
		if (roomIdSet && !roomIdSet.has(roomId)) continue; // not a bill for this hotel's rooms

		const day = created.getDate();
		if (day < 1 || day > daysInMonth) continue;
		const room = Number((b as any).totalRoomPrice ?? (b as any).totalRoom ?? 0);
		const util = Number((b as any).totalUtilitiesPrice ?? (b as any).totalUtilities ?? 0);
		const prev = map.get(day);
		if (prev) {
			prev.totalRoom += room;
			prev.totalUtilities += util;
		} else {
			map.set(day, { totalRoom: room, totalUtilities: util });
		}
	}

	const items: Array<{ day: number; totalRoom: number; totalUtilities: number }> = [];
	for (let d = 1; d <= lastDay; d++) {
		const v = map.get(d);
		items.push({ day: d, totalRoom: v ? v.totalRoom : 0, totalUtilities: v ? v.totalUtilities : 0 });
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
			throw AppError.badRequest("Tham số 'month' phải là số nguyên (1-12)", "INVALID_MONTH");
		}
		if (month < 1 || month > 12) {
			throw AppError.badRequest("Tham số 'month' phải nằm trong 1..12", "INVALID_MONTH");
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
		const rooms = await RoomModel.find({ hotelId: { $in: hotelIdCandidates } }, { _id: 1 }).lean();
		const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
		if (roomIds.length === 0) return { totals: { totalRoom: 0, totalUtilities: 0, total: 0 } };
		roomIdSet = new Set<string>(roomIds.map((id: any) => id.toString()));
	}

	// fetch raw bills and sum
	const rawBills: any[] = await db.getBillsForMonth(month, y);
	let totalRoom = 0;
	let totalUtilities = 0;
	const now = new Date();

	for (const b of rawBills) {
		const created = (b as any).createdAt ? new Date((b as any).createdAt) : null;
		if (!created) continue;
		if (created < start || created >= end) continue;
		// skip future-dated bills in current month
		if (y === now.getFullYear() && month === now.getMonth() + 1 && created > now) continue;
		const roomId = (b as any).roomId ? (b as any).roomId.toString() : null;
		if (roomIdSet && !roomIdSet.has(roomId)) continue;
		totalRoom += Number((b as any).totalRoomPrice ?? (b as any).totalRoom ?? 0);
		totalUtilities += Number((b as any).totalUtilitiesPrice ?? (b as any).totalUtilities ?? 0);
	}

	const total = totalRoom + totalUtilities;
	return { totals: { totalRoom, totalUtilities, total } };
	}
}
