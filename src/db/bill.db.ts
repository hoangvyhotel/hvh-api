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
export async function getBillsForMonth(
  month: number,
  year?: number,
  hotelId?: string
) {
  const now = new Date();
  const y = typeof year === "number" ? year : now.getFullYear();

  // ngày đầu tháng
  const start = new Date(y, month - 1, 1);
  // ngày đầu tháng kế tiếp
  const end = new Date(y, month, 1);

  // điều kiện filter
  const filter: any = {
    createdAt: { $gte: start, $lt: end },
  };

  if (hotelId) {
    filter.hotelId = new Types.ObjectId(hotelId);
  }

  return Bill.find(filter).sort({ createdAt: -1 }).lean().exec();
}

/**
 * Aggregate daily totals for a given month/year.
 * Returns array of documents: { _id: <dayNumber>, totalRoom: <sum>, totalUtilities: <sum> }
 */
export async function getDailyTotalsForMonth(
  month: number,
  year?: number,
  hotelId?: string
) {
  const now = new Date();
  const y = typeof year === "number" ? year : now.getFullYear();
  const start = new Date(y, month - 1, 1);
  const end = new Date(y, month, 1);

  const pipeline: any[] = [
    { $match: { createdAt: { $gte: start, $lt: end } } },
  ];

  if (hotelId) {
    const rooms = await RoomModel.find(
      { hotelId: new Types.ObjectId(hotelId) },
      { _id: 1 }
    ).lean();
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
export async function getMonthlyTotalsForMonth(
  month: number,
  year?: number,
  hotelId?: string
) {
  const now = new Date();
  const y = typeof year === "number" ? year : now.getFullYear();
  const start = new Date(y, month - 1, 1);
  const end = new Date(y, month, 1);

  const pipeline: any[] = [
    { $match: { createdAt: { $gte: start, $lt: end } } },
  ];

  if (hotelId) {
    const rooms = await RoomModel.find(
      { hotelId: new Types.ObjectId(hotelId) },
      { _id: 1 }
    ).lean();
    const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
    if (roomIds.length === 0) return { totalRoom: 0, totalUtilities: 0 };
    pipeline.push({ $match: { roomId: { $in: roomIds } } });
  }

  pipeline.push({
    $group: {
      _id: null,
      totalRoom: { $sum: { $ifNull: ["$totalRoomPrice", 0] } },
      totalUtilities: { $sum: { $ifNull: ["$totalUtilitiesPrice", 0] } },
    },
  });

  const res = await Bill.aggregate(pipeline).exec();
  if (!res || res.length === 0) return { totalRoom: 0, totalUtilities: 0 };
  return {
    totalRoom: res[0].totalRoom || 0,
    totalUtilities: res[0].totalUtilities || 0,
  };
}

/**
 * Create a new Bill document
 */
export async function createBill(payload: any) {
  // coerce roomId to ObjectId if possible
  const p: any = { ...payload };
  if (p.roomId && Types.ObjectId.isValid(p.roomId))
    p.roomId = new Types.ObjectId(p.roomId);
  if (p.createdAt) p.createdAt = new Date(p.createdAt);
  const doc = new Bill(p);
  return doc.save();
}

/**
 * Get a bill by its id
 */
export async function getBillById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Bill.findById(new Types.ObjectId(id)).lean().exec();
}

/**
 * Update a bill by id
 */
export async function updateBillById(id: string, update: any) {
  if (!Types.ObjectId.isValid(id)) return null;
  const u: any = { ...update };
  if (u.roomId && Types.ObjectId.isValid(u.roomId))
    u.roomId = new Types.ObjectId(u.roomId);
  if (u.createdAt) u.createdAt = new Date(u.createdAt);
  return Bill.findByIdAndUpdate(new Types.ObjectId(id), u, { new: true })
    .lean()
    .exec();
}

/**
 * Delete a bill by id
 */
export async function deleteBillById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Bill.findByIdAndDelete(new Types.ObjectId(id)).lean().exec();
}

/**
 * List bills with pagination and optional filters (hotelId, roomId, from/to dates)
 */
export async function listBills({
  page = 1,
  pageSize = 20,
  hotelId,
  roomId,
  from,
  to,
}: any) {
  const match: any = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lt = new Date(to);
  }
  if (roomId) {
    if (Types.ObjectId.isValid(roomId))
      match.roomId = new Types.ObjectId(roomId);
    else match.roomId = roomId;
  }

  // if hotelId provided, find room ids and filter
  if (hotelId) {
    const roomCandidates: any[] = [];
    if (Types.ObjectId.isValid(hotelId))
      roomCandidates.push(new Types.ObjectId(hotelId));
    roomCandidates.push(hotelId);
    const rooms = await RoomModel.find(
      { hotelId: { $in: roomCandidates } },
      { _id: 1 }
    ).lean();
    const roomIds = rooms.map((r: any) => r._id).filter(Boolean);
    if (roomIds.length === 0) return { data: [], total: 0 };
    match.roomId = { $in: roomIds };
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const [data, total] = await Promise.all([
    Bill.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(pageSize) },
      {
        $lookup: {
          from: "rooms", // collection name của RoomModel
          localField: "roomId",
          foreignField: "_id",
          as: "roomInfo",
        },
      },
      {
        $addFields: {
          roomName: { $arrayElemAt: ["$roomInfo.name", 0] },
        },
      },
      {
        $project: {
          roomInfo: 0, // loại bỏ roomInfo để chỉ giữ roomName
        },
      },
    ]).exec(),
    Bill.countDocuments(match).exec(),
  ]);

  return { data, total };
}

export const getBillsByHotelId = async (hotelId: string, date: string) => {
  if (!Types.ObjectId.isValid(hotelId)) {
    throw new Error("ID khách sạn không hợp lệ");
  }

  // Convert string date -> Date (chỉ lấy ngày, bỏ time)
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const pipeline = [
    {
      $match: {
        hotelId: new Types.ObjectId(hotelId),
        $or: [
          // Trường hợp checkIn/Out bao trùm ngày đó
          {
            checkIn: { $lte: endOfDay },
            checkOut: { $gte: startOfDay },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $unwind: {
        path: "$room",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        totalRoomPrice: 1,
        totalUtilitiesPrice: 1,
        createdAt: 1,
        updatedAt: 1,
        roomName: "$room.name",
        checkin: "$checkIn",
        checkout: "$checkOut",
      },
    },
  ];

  return Bill.aggregate(pipeline);
};
