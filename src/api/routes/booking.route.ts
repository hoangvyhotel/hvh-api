import {
  addBooking,
  addNote,
  addSurcharge,
  addUtility,
  getBookingInfo,
  getNote,
  getRoomsByHotel,
  moveRoom,
  removeBooking,
  removeUtility,
} from "@/controllers/booking.controller";
import { Router } from "express";

const router = Router();

router.get("/:id", getRoomsByHotel);
router.post("/", addBooking);
router.get("/booking-info/:roomId", getBookingInfo)
router.get("/get-note/:id", getNote)
router.post("/add-surcharge", addSurcharge);
router.post("/add-note/:id", addNote);
router.post("/add-utility", addUtility);
router.delete("/remove-utility", removeUtility);
router.delete("/remove-booking/:id", removeBooking);
router.patch("/move-room", moveRoom);
router.get("/booking-info/:roomId", getBookingInfo);


export default router;
