import express, { Router } from "express";
import authRoutes from "@/api/routes/auth.route";
// Explicitly type the router as a Router instance
const router: Router = express.Router();

// Mount the routers on their respective paths
router.use("/auth", authRoutes);


export default router;
