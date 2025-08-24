import { Router } from "express";
import {
  getAllRentals,
  getDailyTotals,
  getMonthlyTotal,
} from "@/controllers/rental.controller";

const router = Router();

router.get("/", getAllRentals);

// GET /bills/daily?month=8&year=2025
router.post("/daily", getDailyTotals);
// GET /bills/monthly?month=8&year=2025
router.post("/monthly", getMonthlyTotal);

export default router;
