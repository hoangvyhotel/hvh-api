import { AppError } from "@/utils/AppError";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends AppError {
  public readonly errors: ValidationErrorItem[];

  constructor(errors: ValidationErrorItem[]) {
    super("Yêu cầu không hợp lệ", 400);
    this.errors = errors;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ValidationMiddleware {
  /**
   * Generic validation middleware
   */
  static validate(
    schema: Joi.ObjectSchema,
    property: "body" | "query" | "params" = "body"
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
      });

      if (error) {
        const validationErrors: ValidationErrorItem[] = error.details.map(
          (detail) => ({
            field: detail.path.join("."),
            message: detail.message,
            value: detail.context?.value,
          })
        );

        // Ném ValidationError thay vì AppError
        return next(new ValidationError(validationErrors));
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    };
  }

  /**
   * User validation schemas
   */
  static userSchemas = {
    register: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "any.required": "Password is required",
      }),
      firstName: Joi.string().min(2).max(50).required().messages({
        "string.min": "First name must be at least 2 characters long",
        "string.max": "First name cannot exceed 50 characters",
        "any.required": "First name is required",
      }),
      lastName: Joi.string().min(2).max(50).required().messages({
        "string.min": "Last name must be at least 2 characters long",
        "string.max": "Last name cannot exceed 50 characters",
        "any.required": "Last name is required",
      }),
      phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .messages({
          "string.pattern.base": "Please provide a valid phone number",
        }),
    }),

    login: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
      password: Joi.string().required().messages({
        "any.required": "Password is required",
      }),
    }),

    update: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional(),
      role: Joi.string()
        .valid("admin", "manager", "staff", "customer")
        .optional(),
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required",
      }),
      newPassword: Joi.string().min(6).required().messages({
        "string.min": "New password must be at least 6 characters long",
        "any.required": "New password is required",
      }),
    }),
  };

  /**
   * Room validation schemas
   */
  static roomSchemas = {
    create: Joi.object({
      roomNumber: Joi.string()
        .pattern(/^[A-Z]?\d{3,4}$/)
        .required()
        .messages({
          "string.pattern.base": "Room number must be in format: 101 or A101",
          "any.required": "Room number is required",
        }),
      type: Joi.string()
        .valid("single", "double", "triple", "suite", "deluxe")
        .required()
        .messages({
          "any.only":
            "Room type must be one of: single, double, triple, suite, deluxe",
          "any.required": "Room type is required",
        }),
      floor: Joi.number().integer().min(1).required().messages({
        "number.base": "Floor must be a number",
        "number.integer": "Floor must be an integer",
        "number.min": "Floor must be at least 1",
        "any.required": "Floor is required",
      }),
      price: Joi.number().min(0).required().messages({
        "number.base": "Price must be a number",
        "number.min": "Price cannot be negative",
        "any.required": "Price is required",
      }),
      capacity: Joi.number().integer().min(1).required().messages({
        "number.base": "Capacity must be a number",
        "number.integer": "Capacity must be an integer",
        "number.min": "Capacity must be at least 1",
        "any.required": "Capacity is required",
      }),
      amenities: Joi.array().items(Joi.string()).optional(),
      description: Joi.string().max(500).optional().messages({
        "string.max": "Description cannot exceed 500 characters",
      }),
      images: Joi.array().items(Joi.string().uri()).optional(),
    }),

    update: Joi.object({
      roomNumber: Joi.string()
        .pattern(/^[A-Z]?\d{3,4}$/)
        .optional(),
      type: Joi.string()
        .valid("single", "double", "triple", "suite", "deluxe")
        .optional(),
      floor: Joi.number().integer().min(1).optional(),
      price: Joi.number().min(0).optional(),
      capacity: Joi.number().integer().min(1).optional(),
      amenities: Joi.array().items(Joi.string()).optional(),
      status: Joi.string()
        .valid("available", "occupied", "maintenance", "reserved")
        .optional(),
      description: Joi.string().max(500).optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
    }),
    updateRangePrice: Joi.object({
      typePrice: Joi.string()
        .valid("hours", "day", "night")
        .required()
        .messages({
          "any.only": "Loại giá phải là một trong: hours, day, night",
          "any.required": "Trường typePrice là bắt buộc",
          "string.base": "typePrice phải là chuỗi",
        }),

      data: Joi.array()
        .items(
          Joi.object({
            roomId: Joi.string().hex().length(24).required().messages({
              "string.hex": "roomId phải là ObjectId hợp lệ",
              "string.length": "roomId phải có 24 ký tự",
              "any.required": "roomId là bắt buộc",
            }),
            newPrice: Joi.number().min(0).required().messages({
              "number.base": "Giá mới phải là số",
              "number.min": "Giá mới không được nhỏ hơn 0",
              "any.required": "Giá mới là bắt buộc",
            }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.min": "Phải có ít nhất một phòng cần cập nhật",
          "any.required": "Trường data là bắt buộc",
          "array.base": "data phải là một mảng",
        }),
    }),
  };

  /**
   * Booking validation schemas
   */
  static bookingSchemas = {
    create: Joi.object({
      roomId: Joi.string().required().messages({
        "any.required": "Room ID is required",
      }),
      checkIn: Joi.date().greater("now").required().messages({
        "date.base": "Check-in date must be a valid date",
        "date.greater": "Check-in date must be in the future",
        "any.required": "Check-in date is required",
      }),
      checkOut: Joi.date().greater(Joi.ref("checkIn")).required().messages({
        "date.base": "Check-out date must be a valid date",
        "date.greater": "Check-out date must be after check-in date",
        "any.required": "Check-out date is required",
      }),
      totalAmount: Joi.number().min(0).required().messages({
        "number.base": "Total amount must be a number",
        "number.min": "Total amount cannot be negative",
        "any.required": "Total amount is required",
      }),
      guests: Joi.array()
        .items(
          Joi.object({
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            idNumber: Joi.string().optional(),
            phone: Joi.string()
              .pattern(/^[\+]?[1-9][\d]{0,15}$/)
              .optional(),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.min": "At least one guest is required",
          "any.required": "Guests information is required",
        }),
      specialRequests: Joi.string().max(1000).optional().messages({
        "string.max": "Special requests cannot exceed 1000 characters",
      }),
      paymentMethod: Joi.string()
        .valid("cash", "credit_card", "bank_transfer", "online")
        .optional(),
    }),

    update: Joi.object({
      checkIn: Joi.date().greater("now").optional(),
      checkOut: Joi.date().greater(Joi.ref("checkIn")).optional(),
      totalAmount: Joi.number().min(0).optional(),
      status: Joi.string()
        .valid("pending", "confirmed", "checked_in", "checked_out", "cancelled")
        .optional(),
      paymentStatus: Joi.string()
        .valid("pending", "paid", "failed", "refunded")
        .optional(),
      guests: Joi.array()
        .items(
          Joi.object({
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            idNumber: Joi.string().optional(),
            phone: Joi.string()
              .pattern(/^[\+]?[1-9][\d]{0,15}$/)
              .optional(),
          })
        )
        .min(1)
        .optional(),
      specialRequests: Joi.string().max(1000).optional(),
      paymentMethod: Joi.string()
        .valid("cash", "credit_card", "bank_transfer", "online")
        .optional(),
    }),
  };

  /**
   * Query validation schemas
   */
  static querySchemas = {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().optional(),
      order: Joi.string().valid("asc", "desc").default("desc"),
      search: Joi.string().optional(),
      filter: Joi.object().optional(),
    }),

    roomSearch: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      type: Joi.string()
        .valid("single", "double", "triple", "suite", "deluxe")
        .optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      status: Joi.string()
        .valid("available", "occupied", "maintenance", "reserved")
        .optional(),
      floor: Joi.number().integer().min(1).optional(),
      sort: Joi.string()
        .valid("price", "floor", "roomNumber", "createdAt")
        .default("roomNumber"),
      order: Joi.string().valid("asc", "desc").default("asc"),
    }),
  };
}

// Export convenience functions
export const validateUserRegister = ValidationMiddleware.validate(
  ValidationMiddleware.userSchemas.register
);
export const validateUserLogin = ValidationMiddleware.validate(
  ValidationMiddleware.userSchemas.login
);
export const validateUserUpdate = ValidationMiddleware.validate(
  ValidationMiddleware.userSchemas.update
);
export const validateChangePassword = ValidationMiddleware.validate(
  ValidationMiddleware.userSchemas.changePassword
);

export const validateRoomCreate = ValidationMiddleware.validate(
  ValidationMiddleware.roomSchemas.create
);
export const validateRoomUpdate = ValidationMiddleware.validate(
  ValidationMiddleware.roomSchemas.update
);

export const validateRoomUpdateRange = ValidationMiddleware.validate(
  ValidationMiddleware.roomSchemas.updateRangePrice
);


export const validateBookingCreate = ValidationMiddleware.validate(
  ValidationMiddleware.bookingSchemas.create
);
export const validateBookingUpdate = ValidationMiddleware.validate(
  ValidationMiddleware.bookingSchemas.update
);

export const validatePagination = ValidationMiddleware.validate(
  ValidationMiddleware.querySchemas.pagination,
  "query"
);
export const validateRoomSearch = ValidationMiddleware.validate(
  ValidationMiddleware.querySchemas.roomSearch,
  "query"
);
