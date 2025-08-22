import { ExpensesModel } from "@/models/Expenses";
import { Expense } from "@/types/response/expense";
import { Types } from "mongoose";

export const getAllExpenses = async (
  id: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  const expenses = await ExpensesModel.find({
    hotelId: new Types.ObjectId(id),
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
  return expenses.map((expense) => ({
    _id: expense._id.toString(),
    date: expense.date,
    amount: expense.amount,
    reason: expense.reason,
    note: expense.note,
    hotelId: expense.hotelId.toString(),
  }));
};

export const createExpense = async (data: {
  date: Date;
  amount: number;
  reason: string;
  note?: string;
  hotelId: Types.ObjectId;
}): Promise<Expense> => {
  const expense = new ExpensesModel(data);
  await expense.save();
  return {
    _id: expense._id.toString(),
    date: expense.date,
    amount: expense.amount,
    reason: expense.reason,
    note: expense.note || null,
    hotelId: expense.hotelId.toString(),
  };
};

export const existingExpense = async (id: string) => {
  return await ExpensesModel.findById(id).exec();
};

export const updatedExpense = async (
  id: string,
  data: {
    date: Date;
    amount: number;
    reason: string;
    note?: string;
  }
): Promise<Expense | null> => {
  const expense = await ExpensesModel.findByIdAndUpdate(
    id,
    {
      $set: {
        date: data.date,
        amount: data.amount,
        reason: data.reason,
        note: data.note,
      },
    },
    { new: true } 
  ).lean<Expense>();

  return expense;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await ExpensesModel.findByIdAndDelete(id).exec();
};
