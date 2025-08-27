import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  roomId: Schema.Types.ObjectId;
  checkin: Date;
  checkout?: Date;
  documentInfo?: Record<string, any>[]; // list object JSON
  carInfo?: Record<string, any>[]; // list object JSON
  surcharge?: Record<string, any>[];
  note?: Record<string, any>[];
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
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
    note: {
      type: [
        {
          type: Schema.Types.Mixed,
          required: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
export default Booking;
