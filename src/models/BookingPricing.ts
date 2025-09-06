import mongoose, { Document, HydratedDocument, Schema, Types } from "mongoose";
import { IRoomDocument } from "./Room";

export interface PricingHistory {
  _id?: Types.ObjectId;
  action:
    | "CREATE"
    | "CHANGE_TYPE"
    | "DISCOUNT"
    | "PREPAID"
    | "NEGOTIATE"
    | "SURCHARGE"
    | "CHANGE_ROOM";
  priceType?: string;
  amount?: number;
  description?: string;
  appliedFrom: Date;
  appliedTo?: Date;
  appliedFirstHourPrice?: number;
  appliedNextHourPrice?: number;
  appliedDayPrice?: number;
  appliedNightPrice?: number;
}

const PricingHistorySchema = new Schema<PricingHistory>(
  {
    action: {
      type: String,
      enum: [
        "CREATE",
        "CHANGE_TYPE",
        "DISCOUNT",
        "PREPAID",
        "NEGOTIATE",
        "SURCHARGE",
        "CHANGE_ROOM", // Thêm CHANGE_ROOM vào enum
      ],
      required: true,
    },
    priceType: { type: String },
    amount: { type: Number },
    description: { type: String },
    appliedFrom: { type: Date, default: Date.now },
    appliedTo: { type: Date },
    appliedFirstHourPrice: { type: Number, default: 0 },
    appliedNextHourPrice: { type: Number, default: 0 },
    appliedDayPrice: { type: Number, default: 0 },
    appliedNightPrice: { type: Number, default: 0 },
  },
  { _id: true }
);

export interface IBookingPricing extends Document {
  bookingId: Types.ObjectId;
  roomId?: Types.ObjectId;
  priceType: string;
  startTime: Date;
  endTime?: Date;
  calculatedAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  history: PricingHistory[];
}

const BookingPricingSchema = new Schema<IBookingPricing>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: false,
      index: true,
    },
    priceType: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    calculatedAmount: { type: Number, required: true, min: 0 },
    history: { type: [PricingHistorySchema], default: [] },
  },
  { timestamps: true }
);

export type BookingPricingDocument = HydratedDocument<IBookingPricing & { _id: mongoose.Types.ObjectId }>;
export type BookingPricingWithRoom = BookingPricingDocument & {
  roomId: IRoomDocument;
};

const BookingPricing = mongoose.model<IBookingPricing>(
  "BookingPricing",
  BookingPricingSchema
);

export default BookingPricing;