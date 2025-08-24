import mongoose, { Document, Schema } from "mongoose";

export interface IRental extends Document {
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  totalPrice: number;
  roomId: mongoose.Types.ObjectId;
  enterTime?: Date;
  leaveTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const BillSchema = new Schema<IRental>(
  {
    totalRoomPrice: { type: Number, required: true, min: 0 },
    totalUtilitiesPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    enterTime: { type: Date, required: true },
    leaveTime: { type: Date },
  },
  { timestamps: true }
);

const Rental = mongoose.model<IRental>("Rental", BillSchema);
export default Rental;
