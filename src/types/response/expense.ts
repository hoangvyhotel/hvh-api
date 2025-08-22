import { BaseResponse } from "./base";

interface ExpenseBase {
  _id: string;
}

export interface Expense extends ExpenseBase {
  date: Date;
  amount: number;
  reason: string;
  note?: string | null;
  hotelId: string;
}

export type ExpenseResponse = BaseResponse<Expense[]>;
export type ExpenseCreateResponse = BaseResponse<Expense>;
export type ExpenseUpdateResponse = BaseResponse<Expense>;
