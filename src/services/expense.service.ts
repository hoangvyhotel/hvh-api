import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
  QueryRequest,
} from "@/types/request";
import {
  ExpenseCreateResponse,
  ExpenseResponse,
  ExpenseUpdateResponse,
} from "@/types/response/expense";
import { ResponseHelper } from "@/utils/response";
import { Types } from "mongoose";
import * as expenseDb from "@/db/expense.db";
import {
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  GetAllExpensesRequest,
} from "@/types/request/expense";
import * as hotelService from "@/services/hotel.service";
import { AppError } from "@/utils/AppError";
import { BaseResponse } from "@/types/response";

export const getAllExpenses = async (
  req: QueryRequest<GetAllExpensesRequest>
): Promise<ExpenseResponse> => {
  const { id, date } = req.query;
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Có lỗi khi tìm kiếm chi phí tương ứng với khách sạn");
  }
  const [year, month] = date.split("-").map(Number);

const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  console.log("start", startDate);
  console.log("end", endDate);

  const expenses = await expenseDb.getAllExpenses(id, startDate, endDate);

  return ResponseHelper.success(
    expenses,
    "Lấy danh sách chi phí thành công!",
    "FETCH_SUCCESS"
  );
};

export const createExpense = async (
  req: BodyRequest<ExpenseCreateRequest>
): Promise<ExpenseCreateResponse> => {
  const data = req.body;
  if (!data.hotelId || !Types.ObjectId.isValid(data.hotelId)) {
    throw new Error("ID khách sạn không hợp lệ");
  }
  await hotelService.existingHotel(data.hotelId);
  const expenseData = {
    date: new Date(data.date),
    amount: data.amount,
    reason: data.reason,
    note: data.note || "",
    hotelId: new Types.ObjectId(data.hotelId),
  };
  const expense = await expenseDb.createExpense(expenseData);
  if (!expense) {
    throw new Error("Có lỗi khi tạo chi phí");
  }
  return ResponseHelper.success(
    expense,
    "Tạo chi phí thành công",
    "CREATE_SUCCESS"
  );
};

export const updateExpense = async (
  req: AuthenticatedRequest<{ id: string }, ExpenseUpdateRequest>
): Promise<ExpenseUpdateResponse> => {
  const id = req.params.id;
  const data = req.body;
  console.log("Updating expense with ID:", id);

  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID chi phí không hợp lệ");
  }
  const expenseData = {
    date: new Date(data.date),
    amount: data.amount,
    reason: data.reason,
    note: data.note || "",
  };

  const updatedExpense = await expenseDb.updatedExpense(id, expenseData);
  if (!updatedExpense) {
    throw AppError.notFound("Chi phí không tồn tại");
  }

  return ResponseHelper.success(
    updatedExpense,
    "Cập nhật chi phí thành công",
    "UPDATE_SUCCESS"
  );
};

export const existingExpense = async (id: string) => {
  const expense = await expenseDb.existingExpense(id);
  if (!expense) {
    throw AppError.notFound("Chi phí không tồn tại");
  }
  return expense;
};

export const deleteExpense = async (
  req: ParamsRequest<{ id: string }>
): Promise<BaseResponse<null>> => {
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest("ID chi phí không hợp lệ");
  }

  const expense = await expenseDb.existingExpense(id);
  if (!expense) {
    throw AppError.notFound("Chi phí không tồn tại");
  }

  await expenseDb.deleteExpense(id);

  return ResponseHelper.success(
    null,
    "Xoá chi phí thành công",
    "DELETE_SUCCESS"
  );
};
