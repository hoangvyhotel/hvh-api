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

const router = Router();

// CREATE
/**
 * @route POST /api/rooms
 * @desc Tạo room mới
 * @access Private
 */
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.post("/", createRoom);
router.put("/:id", updateRoom);
router.patch("/status/:id", updateStatus);
router.patch("/update-range", updateRangePrice);


export default router;
