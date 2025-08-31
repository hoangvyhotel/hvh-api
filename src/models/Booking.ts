<<<<<<< HEAD
import mongoose, { Document, Schema, Types } from "mongoose";
import { Note } from "@/types/response/booking";
export interface IBookingItem {
  utilitiesId: Types.ObjectId; 
  quantity: number;
  price?: number;
  name?: string;
}
const NoteSchema = new Schema<Note>(
  {
    Content: { type: String },
    Discount: { type: Number, default: 0 },
    PayInAdvance: { type: Number, default: 0 },
    NegotiatedPrice: { type: Number },
    BookingPricingId: { type: String },
  },
  { _id: false } // vì chỉ có 1 note, không cần _id riêng
);
export interface IBooking extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
=======
import mongoose, { Document, Schema } from "mongoose";
import { BookingItemSchema, IBookingItem } from "./BookingItem";

export interface IBooking extends Document {
  _id: Schema.Types.ObjectId;
  roomId: Schema.Types.ObjectId;
>>>>>>> 6efe901 (feat(getBookings): get bookings which has booked by guest)
  checkin: Date;
  checkout?: Date;
  documentInfo?: Record<string, any>[];
  carInfo?: Record<string, any>[];
  surcharge?: Record<string, any>[];
  note?: Note;
  createdAt?: Date;
  updatedAt?: Date;
  items: IBookingItem[];
}

const BookingItemSchema = new Schema(
  {
    utilitiesId: {
      type: Schema.Types.ObjectId,
      ref: "Utility",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Có thể thêm các field khác nếu cần
    price: { type: Number }, // giá tại thời điểm booking
    name: { type: String }, // tên dịch vụ tại thời điểm booking
  },
  { _id: true }
); // cho phép tạo _id cho mỗi item

const BookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    items: {
      type: [BookingItemSchema],
      default: [],
    },
    checkin: { type: Date, required: true },
    checkout: { type: Date, required: false },
    documentInfo: {
      type: [
        {
          type: Schema.Types.Mixed, // cho phép mọi object
          required: false,
        },
      ],
      default: [],
    },
    carInfo: {
      type: [
        {
          type: Schema.Types.Mixed,
          required: false,
        },
      ],
      default: [],
    },
    surcharge: {
      type: [
        {
          type: Schema.Types.Mixed,
          required: false,
        },
      ],
      default: [],
    },
<<<<<<< HEAD
    note: { type: NoteSchema, required: false },
=======
    note: {
      type: [
        {
          type: Schema.Types.Mixed,
          required: false,
        },
      ],
      default: [],
    },
    items: {
      type: [BookingItemSchema],
      default: [],
    },
>>>>>>> 6efe901 (feat(getBookings): get bookings which has booked by guest)
  },
  { timestamps: true }
);

const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
BookingSchema.index({ roomId: 1, checkin: 1 });
BookingSchema.index({ "items.utilitiesId": 1 }); // để query theo utility
export default Booking;
