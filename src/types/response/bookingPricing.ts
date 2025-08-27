import { PricingHistory } from "@/models/BookingPricing";

export interface PricingHistoryData {
  action: "CREATE" | "CHANGE_TYPE" | "DISCOUNT" | "PREPAID" | "NEGOTIATE";
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

export interface UpdateBookingPricingInput {
  bookingId: string;
  roomId?: string;
  priceType: string;
  action: PricingHistory["action"];
  amount: number;
  description?: string;
  appliedFrom?: Date;
  appliedTo?: Date;
  appliedFirstHourPrice?: number;
  appliedNextHourPrice?: number;
  appliedDayPrice?: number;
  appliedNightPrice?: number;
}