<<<<<<< HEAD
=======

>>>>>>> 077917dbd9b458b1f6c84f988ed3d50ca0e0c572
import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  roomId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const BillSchema = new Schema<IBill>(
  {
    totalRoomPrice: { type: Number, required: true, min: 0 },
    totalUtilitiesPrice: { type: Number, required: true, min: 0 },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
<<<<<<< HEAD
=======

>>>>>>> 077917dbd9b458b1f6c84f988ed3d50ca0e0c572
  },
  { timestamps: true }
);

const Bill = mongoose.model<IBill>("Bill", BillSchema);
export default Bill;
<<<<<<< HEAD
=======

>>>>>>> 077917dbd9b458b1f6c84f988ed3d50ca0e0c572
