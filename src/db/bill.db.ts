import Bill from "@/models/Bill";
import { RoomModel } from "@/models/Room";
import { Types } from "mongoose";

/**
 * Lấy danh sách hoá đơn (Mongoose documents) cho một tháng cụ thể.
 *
 * @param month Tháng tương ứng 1-12
 * @param year Năm (nếu không cung cấp sẽ lấy năm hiện tại)
 * @returns Promise<Array<MongooseDocument>> danh sách hoá đơn (không .lean())
 *
 * Assumptions:
 * - `month` là số 1..12. Nếu truyền giá trị ngoài phạm vi sẽ ném lỗi.
 * - Hàm trả về các document của model `Bill` để service phía trên có thể xử lý tiếp.
 */
export async function getBillsForMonth(month: number, year?: number, hotelId?: string) {
	const now = new Date();
	const y = typeof year === "number" ? year : now.getFullYear();
	const start = new Date(y, month - 1, 1);
	const end = new Date(y, month, 1);

	// Build aggregation pipeline so we can optionally join to Room and filter by hotelId
	const pipeline: any[] = [
		{ $match: { createdAt: { $gte: start, $lt: end } } },
	];

	if (hotelId) {
		const rooms = await RoomModel.find({ hotelId: new Types.ObjectId(hotelId) }, { _id: 1 }).lean();
		const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
		if (roomIds.length === 0) return [];
		pipeline.push({ $match: { roomId: { $in: roomIds } } });
	}

	pipeline.push({ $sort: { createdAt: -1 } });

	return Bill.aggregate(pipeline).exec();
}

/**
 * Aggregate daily totals for a given month/year.
 * Returns array of documents: { _id: <dayNumber>, totalRoom: <sum>, totalUtilities: <sum> }
 */
export async function getDailyTotalsForMonth(month: number, year?: number, hotelId?: string) {
	const now = new Date();
	const y = typeof year === "number" ? year : now.getFullYear();
	const start = new Date(y, month - 1, 1);
	const end = new Date(y, month, 1);

	const pipeline: any[] = [
		{ $match: { createdAt: { $gte: start, $lt: end } } },
	];

	if (hotelId) {
		const rooms = await RoomModel.find({ hotelId: new Types.ObjectId(hotelId) }, { _id: 1 }).lean();
		const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
		if (roomIds.length === 0) return [];
		pipeline.push({ $match: { roomId: { $in: roomIds } } });
	}

	pipeline.push(
		{
			$group: {
				_id: { $dayOfMonth: "$createdAt" },
				totalRoom: { $sum: { $ifNull: ["$totalRoomPrice", 0] } },
				totalUtilities: { $sum: { $ifNull: ["$totalUtilitiesPrice", 0] } },
			},
		},
		{ $sort: { _id: 1 } }
	);

	return Bill.aggregate(pipeline).exec();
}

/**
 * Aggregate monthly totals for a given month/year.
 * Returns single document: { totalRoom, totalUtilities }
 */
export async function getMonthlyTotalsForMonth(month: number, year?: number, hotelId?: string) {
	const now = new Date();
	const y = typeof year === "number" ? year : now.getFullYear();
	const start = new Date(y, month - 1, 1);
	const end = new Date(y, month, 1);

	const pipeline: any[] = [
		{ $match: { createdAt: { $gte: start, $lt: end } } },
	];

	if (hotelId) {
		const rooms = await RoomModel.find({ hotelId: new Types.ObjectId(hotelId) }, { _id: 1 }).lean();
		const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
		if (roomIds.length === 0) return { totalRoom: 0, totalUtilities: 0 };
		pipeline.push({ $match: { roomId: { $in: roomIds } } });
	}

	pipeline.push(
		{
			$group: {
				_id: null,
				totalRoom: { $sum: { $ifNull: ["$totalRoomPrice", 0] } },
				totalUtilities: { $sum: { $ifNull: ["$totalUtilitiesPrice", 0] } },
			},
		}
	);

	const res = await Bill.aggregate(pipeline).exec();
	if (!res || res.length === 0) return { totalRoom: 0, totalUtilities: 0 };
	return { totalRoom: res[0].totalRoom || 0, totalUtilities: res[0].totalUtilities || 0 };
}
