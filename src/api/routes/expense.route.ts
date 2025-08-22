import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
} from "@/controllers/expense.controller";
import { Router } from "express";

const router = Router();

router.get("/", getAllExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);
export default router;