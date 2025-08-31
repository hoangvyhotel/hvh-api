import {
  addBooking,
<<<<<<< HEAD
  addNote,
  addSurcharge,
  addUtility,
  addDocumentInfo,
  addCarInfo,
  updateDocumentInfo,
  updateCarInfo,
  getDocumentInfo,
  getCarInfo,
  changeTypeBooking,
  getBookingInfo,
  getNote,
  getRoomsByHotel,
  moveRoom,
  removeBooking,
  removeUtility,
=======
  getBookingInfo,
  getBookings,
  getRentalBookings,
  getRoomsByHotel,
>>>>>>> 6efe901 (feat(getBookings): get bookings which has booked by guest)
} from "@/controllers/booking.controller";
import { Router } from "express";

const router = Router();

router.get("/", getBookings);
router.get("/rental-bookings", getRentalBookings);
router.get("/:id", getRoomsByHotel);
router.post("/", addBooking);
router.get("/booking-info/:roomId", getBookingInfo);
<<<<<<< HEAD
router.get("/get-note/:id", getNote);
router.post("/add-surcharge", addSurcharge);
router.post("/add-note/:id", addNote);
router.post("/add-utility", addUtility);
router.delete("/remove-utility", removeUtility);
router.post("/add-document", addDocumentInfo);
router.post("/add-car", addCarInfo);
router.get("/document/:id", getDocumentInfo);
router.get("/car/:id", getCarInfo);
router.put("/document", updateDocumentInfo);
router.put("/car", updateCarInfo);
router.delete("/remove-booking/:id", removeBooking);
router.patch("/move-room", moveRoom);
router.get("/booking-info/:roomId", getBookingInfo);
router.patch("/change-type", changeTypeBooking);

=======
>>>>>>> 6efe901 (feat(getBookings): get bookings which has booked by guest)
export default router;
