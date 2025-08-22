import { Router } from "express";
import {
  login,
  register,
  logout,
} from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/register", register);

export default router;
