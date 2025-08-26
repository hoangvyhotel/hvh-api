import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";

// Validation helper functions
const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

const isPositiveNumber = (value: any): boolean => {
  return typeof value === "number" && value >= 0;
};

const isValidInteger = (
  value: any,
  min: number = 1,
  max: number = 50
): boolean => {
  return Number.isInteger(value) && value >= min && value <= max;
};

const isValidString = (
  value: any,
  minLength: number = 1,
  maxLength: number = 500
): boolean => {
  return (
    typeof value === "string" &&
    value.length >= minLength &&
    value.length <= maxLength
  );
};

// Validation middleware cho tạo room
export const validateCreateRoom = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    floor,
    originalPrice,
    afterHoursPrice,
    dayPrice,
    nightPrice,
    description,
    typeHire,
    status,
    hotelId,
  } = req.body;
  const errors: string[] = [];
  console.log(req.body);

  // Validate required fields
  if (!isValidInteger(floor, 1, 50)) {
    errors.push("Tầng phải là số nguyên từ 1 đến 50");
  }

  if (!isPositiveNumber(originalPrice)) {
    errors.push("Giá gốc phải là số dương");
  }

  if (!isPositiveNumber(afterHoursPrice)) {
    errors.push("Giá ngoài giờ phải là số dương");
  }

  if (!isPositiveNumber(dayPrice)) {
    errors.push("Giá ngày phải là số dương");
  }

  if (!isPositiveNumber(nightPrice)) {
    errors.push("Giá đêm phải là số dương");
  }

  if (!isValidString(description, 10, 500)) {
    errors.push("Mô tả phải có độ dài từ 10 đến 500 ký tự");
  }

  if (!isValidInteger(typeHire, 1, 3)) {
    errors.push(
      "Loại thuê phải là 1 (theo giờ), 2 (theo ngày), hoặc 3 (qua đêm)"
    );
  }

  if (status !== undefined && typeof status !== "boolean") {
    errors.push("Trạng thái phải là boolean");
  }

  if (!hotelId || !isValidObjectId(hotelId)) {
    errors.push("Hotel ID phải là MongoDB ObjectId hợp lệ");
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation error: ${errors.join(", ")}`, 400));
  }

  next();
};

// Validation middleware cho cập nhật room
export const validateUpdateRoom = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    floor,
    originalPrice,
    afterHoursPrice,
    dayPrice,
    nightPrice,
    description,
    typeHire,
    status,
    hotelId,
  } = req.body;
  const errors: string[] = [];

  // Validate room ID
  if (!isValidObjectId(id)) {
    errors.push("Room ID phải là MongoDB ObjectId hợp lệ");
  }

  // Validate optional fields
  if (floor !== undefined && !isValidInteger(floor, 1, 50)) {
    errors.push("Tầng phải là số nguyên từ 1 đến 50");
  }

  if (originalPrice !== undefined && !isPositiveNumber(originalPrice)) {
    errors.push("Giá gốc phải là số dương");
  }

  if (afterHoursPrice !== undefined && !isPositiveNumber(afterHoursPrice)) {
    errors.push("Giá ngoài giờ phải là số dương");
  }

  if (dayPrice !== undefined && !isPositiveNumber(dayPrice)) {
    errors.push("Giá ngày phải là số dương");
  }

  if (nightPrice !== undefined && !isPositiveNumber(nightPrice)) {
    errors.push("Giá đêm phải là số dương");
  }

  if (description !== undefined && !isValidString(description, 10, 500)) {
    errors.push("Mô tả phải có độ dài từ 10 đến 500 ký tự");
  }

  if (typeHire !== undefined && !isValidInteger(typeHire, 1, 3)) {
    errors.push(
      "Loại thuê phải là 1 (theo giờ), 2 (theo ngày), hoặc 3 (qua đêm)"
    );
  }

  if (status !== undefined && typeof status !== "boolean") {
    errors.push("Trạng thái phải là boolean");
  }

  if (hotelId !== undefined && !isValidObjectId(hotelId)) {
    errors.push("Hotel ID phải là MongoDB ObjectId hợp lệ");
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation error: ${errors.join(", ")}`, 400));
  }

  next();
};

// Validation middleware cho cập nhật status
export const validateUpdateStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { status } = req.body;
  const errors: string[] = [];

  if (!isValidObjectId(id)) {
    errors.push("Room ID phải là MongoDB ObjectId hợp lệ");
  }

  if (typeof status !== "boolean") {
    errors.push("Status phải là boolean (true/false)");
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation error: ${errors.join(", ")}`, 400));
  }

  next();
};

// Validation middleware cho MongoDB ObjectId trong params
export const validateMongoId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("ID phải là MongoDB ObjectId hợp lệ", 400));
  }

  next();
};

// Validation middleware cho Hotel ID trong params
export const validateHotelId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hotelId } = req.params;

  if (!isValidObjectId(hotelId)) {
    return next(new AppError("Hotel ID phải là MongoDB ObjectId hợp lệ", 400));
  }

  next();
};

// Validation middleware cho query parameters
export const validateHotelIdQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hotelId } = req.query;

  if (hotelId && !isValidObjectId(hotelId as string)) {
    return next(
      new AppError("Hotel ID trong query phải là MongoDB ObjectId hợp lệ", 400)
    );
  }

  next();
};
