import { Router } from "express";
import {
  login,
  register,
  logout,
  loginWithAdmin,
} from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/login-admin", loginWithAdmin);
router.post("/register", register);

export default router;
