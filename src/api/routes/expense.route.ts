import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
  getMonthlyExpenseTotal,
} from "@/controllers/expense.controller";
import { Router } from "express";

const router = Router();

router.get("/", getAllExpenses);
router.post("/monthly", getMonthlyExpenseTotal);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);
export default router;