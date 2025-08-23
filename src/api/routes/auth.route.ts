import { Router } from "express";
import {
  login,
  register,
  logout,
  loginWithAdmin,

} from "@/controllers/auth.controller";

const router = Router();

// Public routes
router.post("/login", login);

router.post("/login-admin", loginWithAdmin);

router.post("/register", register);
router.post("/refresh-token");


// Protected routes
router.post("/logout", logout);

export default router;
