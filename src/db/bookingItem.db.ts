import BookingItem from "@/models/BookingItem";

// export const saveBookingItem = async (data: BookingItemRequest) => {
//   const newBookingItem = BookingItem.create(data);
//   return newBookingItem;
// };

// export const saveAllBookingItems = async (data: BookingItemRequest[]) => {
//   const newBookingItems = BookingItem.insertMany(data);
//   return newBookingItems;
// };

export const getBookingItemsByBookingId = async (bookingId: string) => {
  const bookingItems = BookingItem.find({ bookingId }).lean();
  return bookingItems;
};
