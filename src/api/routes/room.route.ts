import { Router } from "express";
import {
  createRoom,
  getRoomById,
  updateRangePrice,
  updateRoom,
  updateStatus,
  getAllRooms,
  getAllRoomsByHotelId
} from "@/controllers/room.controller";
import {
  validateCreateRoom,
  validateUpdateRoom,
} from "@/middleware/room.validation";
import { validateRoomUpdateRange } from "@/middleware/validation";

const router = Router();

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.get("/:id", getRoomById);
router.post("/", validateCreateRoom, createRoom);
router.get("/", getAllRooms);
router.put("/:id", validateUpdateRoom, updateRoom);
router.patch("/status/:id", updateStatus);
router.get("/hotel/:id", getAllRoomsByHotelId);
router.patch("/update-range", validateRoomUpdateRange, updateRangePrice);

export default router;
