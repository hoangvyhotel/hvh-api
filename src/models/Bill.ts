import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  roomId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
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
  },
  { timestamps: true }
);

const Bill = mongoose.model<IBill>("Bill", BillSchema);
export default Bill;
