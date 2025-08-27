import { addBooking, getBookingInfo, getRoomsByHotel } from "@/controllers/booking.controller";
import { Router } from "express";

const router = Router();

router.get("/:id", getRoomsByHotel);
router.post("/", addBooking);
router.get("/booking-info/:roomId", getBookingInfo)
export default router;
