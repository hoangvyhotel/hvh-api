import { Router } from "express";
import {
  createRoom,
  getAllRooms,
  updateRangePrice,
  getRoomById,
  updateRoom,
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

// GET ROOM BY ID
/**
 * @route POST /api/rooms/:roomId
 * @desc Lấy thông tin phòng theo ID
 * @access Private
 */
router.get("/room/:roomId", getRoomById);

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.post("/", validateCreateRoom, createRoom);
router.get("/", getAllRooms);
router.patch("/update-range", validateRoomUpdateRange, updateRangePrice);

// UPDATE ROOM
/**
 * @route PUT /api/rooms/:roomId
 * @desc Cập nhật thông tin room
 * @access Private
 */
router.put("/:roomId", validateUpdateRoom, updateRoom);

export default router;
