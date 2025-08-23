import express, { Router } from "express";
import authRoutes from "@/api/routes/auth.route";
import roomRoutes from "@/api/routes/room.route";
import expenseRoutes from "@/api/routes/expense.route";

import utilityRoutes from "@/api/routes/utility.route";
import billRoutes from "@/api/routes/bill.route";


// Explicitly type the router as a Router instance
const router: Router = express.Router();
// Mount the routers on their respective paths
router.use("/auth", authRoutes);
router.use("/rooms", roomRoutes);
router.use("/expenses", expenseRoutes);
router.use("/utilities", utilityRoutes);
router.use("/bills", billRoutes);

export default router;
