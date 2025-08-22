import * as db from "@/db/utility.db";
import { AppError } from "@/utils/AppError";

export interface ListOptions {
  hotelId: string;
  status?: string | boolean;
}

export class UtilityService {
  async create(payload: any) {
    try {
      const saved = await db.createUtility(payload);
      return saved;
    } catch (err: any) {
      // Mongo duplicate key
      if (err && (err.code === 11000 || (err?.errorResponse && err.errorResponse.code === 11000))) {
        // include key info if present
        const meta = err.keyValue ? { keyValue: err.keyValue } : err?.errorResponse?.keyValue || {};
        throw AppError.conflict("Tiện ích cùng tên đã tồn tại cho khách sạn này", "DUPLICATE_UTILITY", meta);
      }

      throw err;
    }
  }

  async list(opts: ListOptions) {
    // hotelId is required — do not return all utilities
    if (!opts || !opts.hotelId) {
      throw AppError.badRequest("hotelId là bắt buộc", "MISSING_HOTEL_ID");
    }

    const filter: any = { hotelId: opts.hotelId };
    if (typeof opts.status !== "undefined") filter.status = opts.status === "true" || opts.status === true;

    const items = await db.findUtilities(filter);
    return { items };
  }

  async getById(id: string) {
    return db.getUtilityById(id);
  }

  async update(id: string, payload: any) {
    const updated = await db.updateUtilityById(id, payload);
    return updated;
  }

  async delete(id: string) {
    await db.deleteUtilityById(id);
    return;
  }
}
