import { Router } from "express";
import {
  login,
  register,
  logout,
} from "@/controllers/auth.controller";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/register", register);
router.post("/refresh-token");


// Protected routes
router.post("/logout", logout);

export default router;
