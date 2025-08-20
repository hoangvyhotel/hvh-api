import mongoose from "mongoose";

const BillSchema = new mongoose.Schema(
  {
    totalRoomPrice: { type: Number, required: true },
    totalUtilitiesPrice: { type: Number, required: true },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", BillSchema);
