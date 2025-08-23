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
router.post("/", createUtility);
router.put("/:id", updateUtility);
router.delete("/:id", deleteUtility);

export default router;
