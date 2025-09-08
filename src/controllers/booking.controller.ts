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
<<<<<<< Updated upstream
=======
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const getBookings = catchAsyncErrorWithCode(
  async (req: any, res: Response<BaseResponse<any>>) => {
    const result = await bookingService.getBookings();
>>>>>>> Stashed changes
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

export const addDocumentInfo = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      ID: string;
      TypeID?: string;
      FullName: string;
      Address?: string;
      BirthDay?: string;
      Gender?: boolean;
      EthnicGroup?: string;
    }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.addDocumentInfo(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);

export const addCarInfo = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      LicensePlate: string;
      Color?: string;
      VehicleType?: string;
    }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await bookingService.addCarInfoService(req);
    res.status(200).json(result);
  },
  "ADD_ERROR"
);

export const getDocumentInfo = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<BaseResponse<any[]>>
  ) => {
    const result = await bookingService.getDocumentInfoService(req);
<<<<<<< Updated upstream
=======
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const getRentalBookings = catchAsyncErrorWithCode(
  async (req: any, res: Response<BookingItemResponses>) => {
    const result = await bookingService.getRentalBookings();
>>>>>>> Stashed changes
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const getCarInfo = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<BaseResponse<any[]>>
  ) => {
    const result = await bookingService.getCarInfoService(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const updateDocumentInfo = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      docId: string;
      updates: Partial<{
        ID: string;
        TypeID?: string;
        FullName?: string;
        Address?: string;
        BirthDay?: string;
        Gender?: boolean;
        EthnicGroup?: string;
      }>;
    }>,
    res: Response<BaseResponse<any>>
  ) => {
    const result = await bookingService.updateDocumentInfoService(req);
    res.status(200).json(result);
  },
  "UPDATE_ERROR"
);

export const updateCarInfo = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<{
      bookingId: string;
      licensePlate: string;
      updates: Partial<{
        LicensePlate: string;
        Color?: string;
        VehicleType?: string;
      }>;
    }>,
    res: Response<BaseResponse<any>>
  ) => {
    const result = await bookingService.updateCarInfoService(req);
    res.status(200).json(result);
  },
  "UPDATE_ERROR"
);
