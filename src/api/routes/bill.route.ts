import { Router } from "express";
import {
	getDailyTotals,
	getMonthlyTotal,
	createBill,
	getBill,
	updateBill,
	deleteBill,
	listBills,
} from "@/controllers/bill.controller";

const router = Router();

// reporting
router.post("/daily", getDailyTotals);
router.post("/monthly", getMonthlyTotal);

// CRUD
router.get("/", listBills);
router.post("/", createBill);
router.get("/:id", getBill);
router.put("/:id", updateBill);
router.delete("/:id", deleteBill);

export default router;
