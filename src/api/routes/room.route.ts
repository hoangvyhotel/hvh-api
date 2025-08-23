import { Router } from "express";
import {
  createRoom,
  getAllRooms,
  updateRangePrice,
} from "@/controllers/room.controller";
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateStatus,
  validateMongoId,
  validateHotelId,
  validateHotelIdQuery,
} from "@/middleware/room.validation";
import { validateRoomUpdateRange } from "@/middleware/validation";

const router = Router();

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.post("/", validateCreateRoom, createRoom);
router.get("/", getAllRooms);
router.patch("/update-range", validateRoomUpdateRange, updateRangePrice);

export default router;
