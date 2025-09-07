import { Request, Response } from "express";
import { CreateBillRequest } from "@/types/request/bill/CreateBillRequest.type";
import { UpdateBillRequest } from "@/types/request/bill/UpdateBillRequest.type";
import { BodyRequest, ParamsRequest, QueryRequest } from "@/types/request";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { ResponseHelper } from "@/utils/response";
import { BillService } from "@/services/bill.service";

const service = new BillService();

export const getDailyTotals = catchAsyncErrorWithCode(
  async (
    req: QueryRequest<{ month?: string; year?: string; hotelId?: string }>,
    res: Response
  ) => {
    const monthStr = req.query.month;
    const yearStr = req.query.year;
    const hotelId = req.query.hotelId;

    if (!monthStr) {
      // month is required at controller level
      res
        .status(400)
        .json(
          ResponseHelper.error(
            "Tham số 'month' là bắt buộc",
            "MISSING_MONTH",
            400
          )
        );
      return;
    }

    const month = Number(monthStr);
    const year = yearStr ? Number(yearStr) : undefined;

    const result = await service.getDailyTotals(month, year, hotelId);
    res
      .status(200)
      .json(
        ResponseHelper.success(
          result.items,
          "Lấy tổng tiền theo ngày thành công"
        )
      );
    return;
  },
  "BILL_DAILY_TOTALS_ERROR"
);

export const getMonthlyTotal = catchAsyncErrorWithCode(
  async (
    req: QueryRequest<{ month?: string; year?: string; hotelId?: string }>,
    res: Response
  ) => {
    const monthStr = req.query.month;
    const yearStr = req.query.year;
    const hotelId = req.query.hotelId;

    if (!monthStr) {
      res
        .status(400)
        .json(
          ResponseHelper.error(
            "Tham số 'month' là bắt buộc",
            "MISSING_MONTH",
            400
          )
        );
      return;
    }

    const month = Number(monthStr);
    const year = yearStr ? Number(yearStr) : undefined;

    const result = await service.getMonthlyTotal(month, year, hotelId);
    res
      .status(200)
      .json(
        ResponseHelper.success(
          result.totals,
          "Lấy tổng doanh thu theo tháng thành công"
        )
      );
    return;
  },
  "BILL_MONTHLY_TOTAL_ERROR"
);

export const createBill = catchAsyncErrorWithCode(
  async (req: ParamsRequest<{ roomId: string }>, res: Response) => {
    const created = await service.createBill(req);
    res
      .status(201)
      .json(ResponseHelper.success(created, "Tạo hoá đơn thành công"));
  },
  "BILL_CREATE_ERROR"
);

export const getBill = catchAsyncErrorWithCode(
  async (req: ParamsRequest<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const bill = await service.getBill(id);
    res
      .status(200)
      .json(ResponseHelper.success(bill, "Lấy hoá đơn thành công"));
  },
  "BILL_GET_ERROR"
);

export const updateBill = catchAsyncErrorWithCode(
  async (req: BodyRequest<UpdateBillRequest>, res: Response) => {
    const id = (req as any).params.id as string;
    const payload = req.body as UpdateBillRequest;
    const updated = await service.updateBill(id, payload);
    res
      .status(200)
      .json(ResponseHelper.success(updated, "Cập nhật hoá đơn thành công"));
  },
  "BILL_UPDATE_ERROR"
);

export const deleteBill = catchAsyncErrorWithCode(
  async (req: ParamsRequest<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const deleted = await service.deleteBill(id);
    res
      .status(200)
      .json(ResponseHelper.success(deleted, "Xoá hoá đơn thành công"));
  },
  "BILL_DELETE_ERROR"
);

export const listBills = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{
      hotelId?: string;
    }>,
    res: Response
  ) => {
    const hotelId = req.params.hotelId;
    const bills = await service.listBills(hotelId);

    res
      .status(200)
      .json(ResponseHelper.success(bills, "Lấy danh sách hoá đơn thành công"));
  },
  "BILL_LIST_ERROR"
);
