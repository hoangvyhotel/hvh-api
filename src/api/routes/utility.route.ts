import { Router } from "express";
import {
  createUtility,
  listUtilities,
  getUtility,
  updateUtility,
  deleteUtility,
} from "@/controllers/utility.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Public: list & get
router.get("/", listUtilities);
router.get("/:id", getUtility);

// Protected: create/update/delete
router.post("/", authenticate, createUtility);
router.put("/:id", authenticate, updateUtility);
router.delete("/:id", authenticate, deleteUtility);

export default router;
