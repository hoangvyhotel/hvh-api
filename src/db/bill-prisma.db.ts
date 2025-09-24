import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// ===============================
// Get bills for a given month
// ===============================
export async function getBillsForMonth(
  month: number,
  year?: number,
  hotelId?: number
) {
  const now = new Date();
  const y = year ?? now.getFullYear();

  const start = new Date(y, month - 1, 1);
  const end = new Date(y, month, 1);

  return prisma.bill.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      ...(hotelId ? { hotelId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

// ===============================
// Daily totals for a given month
// ===============================
export async function getDailyTotalsForMonth(
  month: number,
  year?: number,
  hotelId?: number
) {
  const now = new Date();
  const y = year ?? now.getFullYear();

  const start = new Date(y, month - 1, 1);
  const end = new Date(y, month, 1);

  const bills = await prisma.bill.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      ...(hotelId ? { hotelId } : {}),
    },
    select: {
      createdAt: true,
      totalRoomPrice: true,
      totalUtilitiesPrice: true,
    },
  });

  // Group by day (JS thay vì Mongo aggregate)
  const grouped: Record<number, { totalRoom: number; totalUtilities: number }> =
    {};

  for (const b of bills) {
    const day = b.createdAt.getDate();
    if (!grouped[day]) grouped[day] = { totalRoom: 0, totalUtilities: 0 };
    grouped[day].totalRoom += b.totalRoomPrice ?? 0;
    grouped[day].totalUtilities += b.totalUtilitiesPrice ?? 0;
  }

  return Object.entries(grouped).map(([day, totals]) => ({
    _id: Number(day),
    ...totals,
  }));
}

// ===============================
// Monthly totals
// ===============================
export async function getMonthlyTotalsForMonth(
  month: number,
  year?: number,
  hotelId?: number
) {
  const now = new Date();
  const y = year ?? now.getFullYear();

  const start = new Date(y, month - 1, 1);
  const end = new Date(y, month, 1);

  const bills = await prisma.bill.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      ...(hotelId ? { hotelId } : {}),
    },
    select: {
      totalRoomPrice: true,
      totalUtilitiesPrice: true,
    },
  });

  const totals = bills.reduce(
    (
      acc: { totalRoom: any; totalUtilities: any },
      b: { totalRoomPrice: any; totalUtilitiesPrice: any }
    ) => {
      acc.totalRoom += b.totalRoomPrice ?? 0;
      acc.totalUtilities += b.totalUtilitiesPrice ?? 0;
      return acc;
    },
    { totalRoom: 0, totalUtilities: 0 }
  );

  return totals;
}

// ===============================
// Create bill
// ===============================
export async function createBill(payload: any) {
  return prisma.bill.create({
    data: {
      ...payload,
      createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
    },
  });
}

// ===============================
// Get bill by id
// ===============================
export async function getBillById(id: number) {
  return prisma.bill.findUnique({ where: { id } });
}

// ===============================
// Update bill by id
// ===============================
export async function updateBillById(id: number, update: any) {
  return prisma.bill.update({
    where: { id },
    data: {
      ...update,
      createdAt: update.createdAt ? new Date(update.createdAt) : undefined,
    },
  });
}

// ===============================
// Delete bill by id
// ===============================
export async function deleteBillById(id: number) {
  return prisma.bill.delete({ where: { id } });
}

// ===============================
// List bills with pagination & filters
// ===============================
export async function listBills({
  page = 1,
  pageSize = 20,
  hotelId,
  roomId,
  from,
  to,
}: {
  page?: number;
  pageSize?: number;
  hotelId?: number;
  roomId?: number;
  from?: string;
  to?: string;
}) {
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lt = new Date(to);
  }
  if (roomId) where.roomId = roomId;
  if (hotelId) where.hotelId = hotelId;

  const [data, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { name: true } },
      },
    }),
    prisma.bill.count({ where }),
  ]);

  return {
    data: data.map((d: { room: { name: any } }) => ({
      ...d,
      roomName: d.room?.name ?? null,
    })),
    total,
  };
}

// ===============================
// Bills by hotelId & date
// ===============================
export const getBillsByHotelId = async (hotelId: number, date: string) => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  return prisma.bill.findMany({
    where: {
      hotelId,
      checkIn: { lte: endOfDay },
      checkOut: { gte: startOfDay },
    },
    include: {
      room: { select: { name: true } },
    },
  });
};
