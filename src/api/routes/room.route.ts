import { Router } from "express";
import {
  createRoom,
  getRoomById,
  updateRangePrice,
  updateRoom,
  updateStatus,
  getAllRooms,
  getRoomAvailable,
} from "@/controllers/room.controller";
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateStatus,
} from "@/middleware/room.validation";
import { validateRoomUpdateRange } from "@/middleware/validation";

const router = Router();

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.patch("/available", getRoomAvailable);
router.post("/", validateCreateRoom, createRoom);
router.put("/:id", validateUpdateRoom, updateRoom);
router.patch("/status/:id", validateUpdateStatus, updateStatus);
router.patch("/update-range", validateRoomUpdateRange, updateRangePrice);

export default router;
