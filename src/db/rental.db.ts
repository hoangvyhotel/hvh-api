import Rental from "@/models/Rental";
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
export async function getBillsForMonth(
  month: number,
  year?: number,
  hotelId?: string
) {
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

  return Rental.aggregate(pipeline).exec();
}

export async function getAllRentals() {
  return Rental.find().sort({ createdAt: -1 }).exec();
}

export async function getRentalById(id: string) {
  return Rental.findById(id).exec();
}

// TODO: pagination, filtering...
export async function createRental(data: {
  enterTime: Date;
  leaveTime?: Date;
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  totalPrice: number;
  roomId: Types.ObjectId;
}) {
  const rental = new Rental(data);
  await rental.save();
  return rental;
}

export async function updateRental(
  id: string,
  data: {
    enterTime: Date;
    leaveTime: Date;
    totalRoomPrice: number;
    totalUtilitiesPrice: number;
    totalPrice: number;
    roomId: string;
  }
) {
  return Rental.findByIdAndUpdate(id, {
    $set: {
      totalRoomPrice: data.totalRoomPrice,
      totalUtilitiesPrice: data.totalUtilitiesPrice,
      totalPrice: data.totalPrice,
      enterTime: data.enterTime,
      leaveTime: data.leaveTime,
      roomId: new Types.ObjectId(data.roomId),
    },
  }).exec();
}

export async function deleteRental(id: string) {
  return Rental.findByIdAndDelete(id).exec();
}
