import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
} from "@/types/request/base";
import {
  BookingItemResponse,
  BookingItemResponses,
  GetBookingInFoResponse,
  GetRoomsByHotelResponse,
  Note,
  Surcharge,
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

export const addSurcharge = catchAsyncErrorWithCode(
  async (req: BodyRequest<Surcharge>, res: Response<BaseResponse<null>>) => {
    const result = await bookingService.AddSurcharge(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);

export const addNote = catchAsyncErrorWithCode(
  async (
    req: AuthenticatedRequest<{ id: string }, Note>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.AddNote(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);

export const getNote = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<BaseResponse<Note | null>>
  ) => {
    const result = await bookingService.getNoteByBooking(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const addUtility = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      utilityId: string;
      bookingId: string;
      quantity?: number;
    }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.AddUtility(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);

export const removeUtility = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      utilityId: string;
      quantity?: number;
    }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.RemoveUtilityService(req);
    res.status(200).json(result);
  },
  "DELETE_ERROR"
);

export const removeBooking = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.removeBooking(req);
    res.status(200).json(result);
  },
  "DELETE_ERROR"
);

export const getBookings = catchAsyncErrorWithCode(
  async (req: any, res: Response<BaseResponse<any>>) => {
    const result = await bookingService.getBookings();
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const getRentalBookings = catchAsyncErrorWithCode(
  async (req: any, res: Response<BookingItemResponses>) => {
    const result = await bookingService.getRentalBookings();
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const moveRoom = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{ bookingId: string; newRoomId: string }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.moveRoom(req);
    res.status(201).json(result);
  },
  "MOVE_ERROR"
);

export const changeTypeBooking = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      newPriceType: "HOUR" | "DAY" | "NIGHT";
    }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.changeTypeBooking(req);
    res.status(201).json(result);
  },
  "CHANGE_ERROR"
);
