import { Router } from "express";
import { login, register, logout } from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";
import { createUser } from "@/controllers/auth.controller";

const router = Router();

// Public routes

router.post("/add", createUser);

export default router;
