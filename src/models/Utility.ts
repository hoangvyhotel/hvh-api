import mongoose, { Document, Schema } from "mongoose";

export interface IUtility extends Document {
  name: string;
  price: number;
  icon?: string;
  status: boolean;
  hotelId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const UtilitySchema = new Schema<IUtility>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    icon: { type: String, required: false, trim: true },
    status: { type: Boolean, required: true, default: true },
    hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
  },
  { timestamps: true }
);

// Optional: ensure name unique per hotel
UtilitySchema.index({ hotelId: 1, name: 1 }, { unique: true });

const Utility = mongoose.model<IUtility>("Utility", UtilitySchema);
export default Utility;