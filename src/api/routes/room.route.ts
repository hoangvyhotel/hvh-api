import { Router } from "express";
import { createRoom } from "@/controllers/room.controller";
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateStatus,
  validateMongoId,
  validateHotelId,
  validateHotelIdQuery,
} from "@/middleware/room.validation";

const router = Router();

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.post("/", validateCreateRoom, createRoom);

export default router;
