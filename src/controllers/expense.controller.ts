import {
  AuthenticatedRequest,
  BodyRequest,
  ParamsRequest,
  QueryRequest,
} from "@/types/request";
import { catchAsyncErrorWithCode } from "@/utils/catchAsyncError";
import { Response } from "express";
import * as expenseService from "@/services/expense.service";
import {
  ExpenseCreateResponse,
  ExpenseResponse,
  ExpenseUpdateResponse,
} from "@/types/response/expense";
import {
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  GetAllExpensesRequest,
} from "@/types/request/expense";
import { BaseResponse } from "@/types/response";
export const getAllExpenses = catchAsyncErrorWithCode(
  async (
    req: QueryRequest<GetAllExpensesRequest>,
    res: Response<ExpenseResponse>
  ) => {
    console.log("Fetching all expenses for hotel ID:", req.query.id);
    console.log("Date filter:", req.query.date);
    const result = await expenseService.getAllExpenses(req);
    res.status(200).json(result);
  },
  "FETCH_ERROR"
);

export const createExpense = catchAsyncErrorWithCode(
  async (
    req: BodyRequest<ExpenseCreateRequest>,
    res: Response<ExpenseCreateResponse>
  ) => {
    const result = await expenseService.createExpense(req);
    res.status(201).json(result);
  },
  "CREATE_ERROR"
);

export const updateExpense = catchAsyncErrorWithCode(
  async (
    req: AuthenticatedRequest<{ id: string }, ExpenseUpdateRequest>,
    res: Response<ExpenseUpdateResponse>
  ) => {
    const result = await expenseService.updateExpense(req);
    res.status(201).json(result);
  },
  "UPDATE_ERROR"
);

export const deleteExpense = catchAsyncErrorWithCode(
  async (
    req: ParamsRequest<{ id: string }>,
    res: Response<BaseResponse<null>>
  ) => {
    const result = await expenseService.deleteExpense(req);
    res.status(200).json(result);
  },
  "DELETE_ERROR"
);
