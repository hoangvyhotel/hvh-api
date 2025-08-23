import Bill from "@/models/Bill";
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
		// join Room to access room.hotelId
		pipeline.push(
			{
				$lookup: {
					from: "rooms",
					localField: "roomId",
					foreignField: "_id",
					as: "room",
				},
			},
			{ $unwind: "$room" },
			{ $match: { "room.hotelId": new Types.ObjectId(hotelId) } }
		);
	}

	pipeline.push({ $sort: { createdAt: -1 } });

	return Bill.aggregate(pipeline).exec();
}
