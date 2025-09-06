import { TYPE_BOOKINGS } from "@/constant/constant";
import { BaseResponse } from "./base";

export interface GetRoomsByHotel {
  HotelId: string;
  RoomName: string;
  Status: string;
  TypeBooking?:
    | typeof TYPE_BOOKINGS.DAY
    | typeof TYPE_BOOKINGS.HOUR
    | typeof TYPE_BOOKINGS.NIGHT;
  Utilities?: UtilitiesForBooking[];
  Description?: string;
  Floor: number;
  Checkin?: Date;
}

interface UtilitiesForBooking {
  Quantity: number;
  Icon: string;
}

export interface GetBookingInfo {
  BookingId: string;
  RoomName: string;
  TypeBooking: string;
  CheckinDate: Date;
  Times?: number;
  Surcharge?: Surcharge[];
  Notes?: Note;
  Utilities?: UtilitiesForBooking[];
  Documents?: Document[];
  CarInfos?: CarInfo[];
  BookingPricing: BookingPricing[];
}

export interface PricingHistoryType {
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
  appliedFrom: string;
  appliedTo?: string;
  appliedFirstHourPrice?: number;
  appliedNextHourPrice?: number;
  appliedDayPrice?: number;
  appliedNightPrice?: number;
  Times?: number;
}

export interface BookingPricing {
  PriceType: string;
  StartDate: string;
  EndDate?: string;
  CalculatedAmount?: number;
  History: PricingHistoryType[];
}
export interface Document {
  ID: string;
  TypeID: "CCCD" | "CMND";
  FullName: string;
  Address: string;
  BirthDay: string;
  Gender: boolean;
  EthnicGroup: string; //dân tộc
}

export interface CarInfo {
  LicensePlate: string; // biển số xe
}
export interface Surcharge {
  Content?: string;
  Amount?: number;
  BookingId?: string;
}

export interface Note {
  Content?: string;
  Discount?: number;
  PayInAdvance?: number;
  NegotiatedPrice?: number;
  BookingPricingId?: string;
  BookingId?: string;
}

export type GetRoomsByHotelResponse = BaseResponse<GetRoomsByHotel[]>;
export type GetBookingInFoResponse = BaseResponse<GetBookingInfo>;
