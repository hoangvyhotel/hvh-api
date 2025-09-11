import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  roomId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  checkIn: Date;   // 👈 ngày nhận phòng
  checkOut: Date;  // 👈 ngày trả phòng
  createdAt?: Date;
  updatedAt?: Date;
}

const BillSchema = new Schema<IBill>(
  {
    totalRoomPrice: { type: Number, required: true, min: 0 },
    totalUtilitiesPrice: { type: Number, required: true, min: 0 },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    checkIn: { type: Date, required: true },   // 👈 thêm field checkIn
    checkOut: { type: Date, required: true },  // 👈 thêm field checkOut
  },
  { timestamps: true }
);

const Bill = mongoose.model<IBill>("Bill", BillSchema);
export default Bill;
