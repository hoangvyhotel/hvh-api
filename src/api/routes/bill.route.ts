import { Router } from "express";
import { getDailyTotals, getMonthlyTotal } from "@/controllers/bill.controller";

const router = Router();

// GET /bills/daily?month=8&year=2025
router.post("/daily", getDailyTotals);
// GET /bills/monthly?month=8&year=2025
router.post("/monthly", getMonthlyTotal);

export default router;
