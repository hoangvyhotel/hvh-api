// import { PrismaClient } from "@/generated/prisma";
// import { database } from "@/config/database-prisma";

// export class BookingDatabase {
//   private prisma: PrismaClient;

//   constructor() {
//     this.prisma = database.getClient();
//   }

//   // Tạo booking mới với booking items
//   async createBooking(bookingData: {
//     checkIn: Date;
//     checkOut: Date;
//     totalAmount: number;
//     status: string;
//     hotelId: number;
//     items: Array<{
//       roomId: number;
//       startTime: Date;
//       endTime: Date;
//       price: number;
//     }>;
//   }) {
//     return await this.prisma.$transaction(async (prisma) => {
//       // Tạo booking
//       const booking = await prisma.booking.create({
//         data: {
//           checkIn: bookingData.checkIn,
//           checkOut: bookingData.checkOut,
//           totalAmount: bookingData.totalAmount,
//           status: bookingData.status,
//           hotelId: bookingData.hotelId,
//         },
//       });

//       // Tạo booking items
//       const bookingItems = await prisma.bookingItem.createMany({
//         data: bookingData.items.map((item) => ({
//           bookingId: booking.id,
//           roomId: item.roomId,
//           startTime: item.startTime,
//           endTime: item.endTime,
//           price: item.price,
//         })),
//       });

//       return { booking, bookingItems };
//     });
//   }

//   // Lấy booking theo ID
//   async getBookingById(id: number) {
//     return await this.prisma.booking.findUnique({
//       where: { id },
//       include: {
//         hotel: true,
//         bookingItems: {
//           include: {
//             room: true,
//           },
//         },
//         bills: true,
//       },
//     });
//   }

//   // Lấy tất cả bookings theo hotel
//   async getBookingsByHotelId(hotelId: number) {
//     return await this.prisma.booking.findMany({
//       where: { hotelId },
//       include: {
//         bookingItems: {
//           include: {
//             room: true,
//           },
//         },
//         bills: true,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });
//   }

//   // Cập nhật booking
//   async updateBooking(id: number, bookingData: any) {
//     return await this.prisma.booking.update({
//       where: { id },
//       data: bookingData,
//       include: {
//         bookingItems: {
//           include: {
//             room: true,
//           },
//         },
//       },
//     });
//   }

//   // Xóa booking
//   async deleteBooking(id: number) {
//     return await this.prisma.booking.delete({
//       where: { id },
//     });
//   }

//   // Lấy bookings trong khoảng thời gian
//   async getBookingsInDateRange(
//     hotelId: number,
//     startDate: Date,
//     endDate: Date
//   ) {
//     return await this.prisma.booking.findMany({
//       where: {
//         hotelId,
//         OR: [
//           {
//             checkIn: {
//               gte: startDate,
//               lte: endDate,
//             },
//           },
//           {
//             checkOut: {
//               gte: startDate,
//               lte: endDate,
//             },
//           },
//         ],
//       },
//       include: {
//         bookingItems: {
//           include: {
//             room: true,
//           },
//         },
//       },
//     });
//   }
// }

// // Export singleton instance
// export const bookingDatabase = new BookingDatabase();
