import { Router } from "express";
import { getDailyTotals, getMonthlyTotal } from "@/controllers/bill.controller";

const router = Router();

router.post("/daily", getDailyTotals);
router.post("/monthly", getMonthlyTotal);

export default router;
