import { boolean } from "joi";
import mongoose, { Document, Schema } from "mongoose";

export interface IBookingPricing extends Document {
  bookingId: Schema.Types.ObjectId;
  priceType: string; // "HOUR" | "DAY" | "NIGHT" ...
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  appliedFirstHourPrice?: number;
  appliedNextHourPrice?: number;
  appliedDayPrice?: number;
  appliedNightPrice?: number;
  calculatedAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingPricingSchema = new Schema<IBookingPricing>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    priceType: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: false },
    isActive: { type: Boolean, default: true },
    appliedFirstHourPrice: { type: Number, default: 0 },
    appliedNextHourPrice: { type: Number, default: 0 },
    appliedDayPrice: { type: Number, default: 0 },
    appliedNightPrice: { type: Number, default: 0 },
    calculatedAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const BookingPricing = mongoose.model<IBookingPricing>(
  "BookingPricing",
  BookingPricingSchema
);
export default BookingPricing;
