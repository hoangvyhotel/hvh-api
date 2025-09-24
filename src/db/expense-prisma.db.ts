import { Expense } from "@/types/response/expense";
import { PrismaClient } from "../generated/prisma"; // Adjust the import path based on your Prisma client location

const prisma = new PrismaClient();

export const getAllExpenses = async (
  id: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  const expenses = await prisma.expenses.findMany({
    where: {
      hotelId: parseInt(id),
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
  return expenses.map((expense) => ({
    _id: expense.id.toString(),
    date: expense.date,
    amount: expense.amount,
    reason: expense.reason,
    note: expense.note,
    hotelId: expense.hotelId.toString(),
  }));
};

export const getMonthlyExpenseTotal = async (
  id: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const result = await prisma.expenses.aggregate({
    where: {
      hotelId: parseInt(id),
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
};

export const createExpense = async (data: {
  date: Date;
  amount: number;
  reason: string;
  note?: string;
  hotelId: number;
}): Promise<Expense> => {
  const expense = await prisma.expenses.create({
    data: {
      date: data.date,
      amount: data.amount,
      reason: data.reason,
      note: data.note,
      hotelId: data.hotelId,
    },
  });
  return {
    _id: expense.id.toString(),
    date: expense.date,
    amount: expense.amount,
    reason: expense.reason,
    note: expense.note || null,
    hotelId: expense.hotelId.toString(),
  };
};

export const existingExpense = async (id: string) => {
  return await prisma.expenses.findUnique({
    where: { id: parseInt(id) },
  });
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
  const expense = await prisma.expenses.update({
    where: { id: parseInt(id) },
    data: {
      date: data.date,
      amount: data.amount,
      reason: data.reason,
      note: data.note,
    },
  });

  if (!expense) return null;

  return {
    _id: expense.id.toString(),
    date: expense.date,
    amount: expense.amount,
    reason: expense.reason,
    note: expense.note,
    hotelId: expense.hotelId.toString(),
  };
};

export const deleteExpense = async (id: string): Promise<void> => {
  await prisma.expenses.delete({
    where: { id: parseInt(id) },
  });
};