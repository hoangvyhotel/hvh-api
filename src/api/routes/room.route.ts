import { Router } from "express";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  getRoomsByHotelId,
  getAvailableRooms,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  hardDeleteRoom,
  getRoomStats,
} from "@/controllers/room.controller";
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

// READ
/**
 * @route GET /api/rooms
 * @desc Lấy tất cả rooms
 * @access Private
 */
router.get("/", getAllRooms);

/**
 * @route GET /api/rooms/available
 * @desc Lấy danh sách rooms có sẵn
 * @query hotelId (optional)
 * @access Public
 */
router.get("/available", validateHotelIdQuery, getAvailableRooms);

/**
 * @route GET /api/rooms/stats
 * @desc Lấy thống kê rooms
 * @query hotelId (optional)
 * @access Private
 */
router.get("/stats", validateHotelIdQuery, getRoomStats);

/**
 * @route GET /api/rooms/hotel/:hotelId
 * @desc Lấy rooms theo hotel ID
 * @access Private
 */
router.get("/hotel/:hotelId", validateHotelId, getRoomsByHotelId);

/**
 * @route GET /api/rooms/:id
 * @desc Lấy room theo ID
 * @access Private
 */
router.get("/:id", validateMongoId, getRoomById);

// UPDATE
/**
 * @route PUT /api/rooms/:id
 * @desc Cập nhật room
 * @access Private
 */
router.put("/:id", validateUpdateRoom, updateRoom);

/**
 * @route PATCH /api/rooms/:id/status
 * @desc Cập nhật status room
 * @access Private
 */
router.patch("/:id/status", validateUpdateStatus, updateRoomStatus);

// DELETE
/**
 * @route DELETE /api/rooms/:id
 * @desc Xóa room (soft delete)
 * @access Private
 */
router.delete("/:id", validateMongoId, deleteRoom);

/**
 * @route DELETE /api/rooms/:id/permanent
 * @desc Xóa room hoàn toàn (hard delete)
 * @access Private
 */
router.delete("/:id/permanent", validateMongoId, hardDeleteRoom);

export default router;
