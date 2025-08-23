import { Router } from "express";
import {
  login,
  register,
  logout,
  loginWithAdmin,
<<<<<<< HEAD
=======

>>>>>>> 077917dbd9b458b1f6c84f988ed3d50ca0e0c572
} from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Public routes
router.post("/login", login);
<<<<<<< HEAD
router.post("/login-admin", loginWithAdmin);
router.post("/register", register);
=======

router.post("/login-admin", loginWithAdmin);

router.post("/register", register);
router.post("/refresh-token");


// Protected routes
router.use(authenticate); 
router.post("/logout", logout);
>>>>>>> 077917dbd9b458b1f6c84f988ed3d50ca0e0c572

export default router;
