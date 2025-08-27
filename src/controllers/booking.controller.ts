import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
} from "@/types/request/base";
import {
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
} from "@/types/response/booking";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { Response } from "express";
import * as bookingService from "../services/booking.service";
import { BaseResponse } from "@/types/response";

export const getRoomsByHotel = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<GetRoomsByHotelResponse>
  ) => {
    const result = await bookingService.getRoomsByHotel(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const getBookingInfo = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ roomId: string }>,
    res: Response<GetBookingInFoResponse>
  ) => {
    const result = await bookingService.getBookingInfo(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const addBooking = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{ roomId: string; type: string }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.addBooking(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);
