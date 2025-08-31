import {
  addBooking,
  getBookingInfo,
  getBookings,
  getRentalBookings,
  getRoomsByHotel,
} from "@/controllers/booking.controller";
import { Router } from "express";

const router = Router();

router.get("/", getBookings);
router.get("/rental-bookings", getRentalBookings);
router.get("/:id", getRoomsByHotel);
router.post("/", addBooking);
router.get("/booking-info/:roomId", getBookingInfo);
export default router;
