import { Router } from "express";
import {
  login,
  register,
  logout,
  loginWithAdmin,
  changeStaffPassword,
  changeAdminPassword,
} from "@/controllers/auth.controller";

const router = Router();

// Public routes
router.post("/login", login);

router.post("/login-admin", loginWithAdmin);

router.post("/register", register);
router.post("/refresh-token");

// Protected routes
router.post("/logout", logout);

// Change password
router.post("/change-password", changeStaffPassword);
router.post("/change-admin-password", changeAdminPassword);

export default router;
