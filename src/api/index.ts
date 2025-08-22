import express, { Router } from "express";
import authRoutes from "@/api/routes/auth.route";
import roomRoutes from "@/api/routes/room.route";
import expenseRoutes from "@/api/routes/expense.route";

// Explicitly type the router as a Router instance
const router: Router = express.Router();

// Mount the routers on their respective paths
router.use("/auth", authRoutes);
router.use("/rooms", roomRoutes);
router.use("/expenses", expenseRoutes);


export default router;
