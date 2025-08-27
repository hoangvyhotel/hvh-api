import mongoose, { Document, Schema } from "mongoose";

export interface IBookingItem extends Document {
  bookingId: Schema.Types.ObjectId;
  utilitiesId: Schema.Types.ObjectId; // ref tới bảng Utilities
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingItemSchema = new Schema<IBookingItem>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    utilitiesId: { type: Schema.Types.ObjectId, ref: "Utility" },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

const BookingItem = mongoose.model<IBookingItem>(
  "BookingItem",
  BookingItemSchema
);
export default BookingItem;
