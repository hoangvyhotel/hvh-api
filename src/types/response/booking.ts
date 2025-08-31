import { BaseResponse } from "./base";

export interface GetRoomsByHotel {
  HotelId: string;
  RoomName: string;
  Status: string;
  TypeBooking?: "Day" | "Hours" | "Night";
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
  Surcharge?: Surcharge[];
  Notes?: Note[];
  Utilities?: UtilitiesForBooking[];
  Documents?: Document[];
  CarInfos?: CarInfo[];
  BookingPricing: BookingPricing[];
}

export interface BookingPricing {
  PriceType: string;
  StartDate: string;
  EndDate?: string;
  AppliedFirstHourPrice?: number;
  AppliedNextHourPrice?: number;
  AppliedDayPrice?: number;
  AppliedNightPrice?: number;
  CalculatedAmount?: number;
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
  Amout?: number;
}

export interface Note {
  Content?: string;
  Discount?: number;
  PayInAdvance?: number;
  NegotiatedPrice?: Number;
}

export interface BookingItemResponse {
  roomName: string;
  checkin: Date;
  checkout?: Date;
  utilitiesPrice: number;
  roomPrice: number;
  isCheckout: boolean;
}

export type GetRoomsByHotelResponse = BaseResponse<GetRoomsByHotel[]>;
export type GetBookingInFoResponse = BaseResponse<GetBookingInfo>;
export type BookingItemResponses = BaseResponse<BookingItemResponse[]>;
