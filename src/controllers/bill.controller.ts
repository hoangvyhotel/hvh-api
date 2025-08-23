import { Response } from "express";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { BillService } from "@/services/bill.service";
import { QueryRequest } from "@/types/request/base";

const service = new BillService();

export const getDailyTotals = catchAsyncErrorWithCode(async (req: QueryRequest<{ month?: string; year?: string; hotelId?: string }>, res: Response) => {
  const monthStr = req.query.month;
  const yearStr = req.query.year;
  const hotelId = req.query.hotelId;

  if (!monthStr) {
    // month is required at controller level
    res.status(400).json(ResponseHelper.error("Tham số 'month' là bắt buộc", "MISSING_MONTH", 400));
    return;
  }

  const month = Number(monthStr);
  const year = yearStr ? Number(yearStr) : undefined;

  const result = await service.getDailyTotals(month, year, hotelId);
  res.status(200).json(ResponseHelper.success(result.items, "Lấy tổng tiền theo ngày thành công"));
  return;
}, "BILL_DAILY_TOTALS_ERROR");

export const getMonthlyTotal = catchAsyncErrorWithCode(async (req: QueryRequest<{ month?: string; year?: string; hotelId?: string }>, res: Response) => {
  const monthStr = req.query.month;
  const yearStr = req.query.year;
  const hotelId = req.query.hotelId;

  if (!monthStr) {
    res.status(400).json(ResponseHelper.error("Tham số 'month' là bắt buộc", "MISSING_MONTH", 400));
    return;
  }

  const month = Number(monthStr);
  const year = yearStr ? Number(yearStr) : undefined;

  const result = await service.getMonthlyTotal(month, year, hotelId);
  res.status(200).json(ResponseHelper.success(result.totals, "Lấy tổng doanh thu theo tháng thành công"));
  return;
}, "BILL_MONTHLY_TOTAL_ERROR");
