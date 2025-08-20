import mongoose from "mongoose";

const Utilities = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    icon: { type: String, required: true },
    status: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Utilities", Utilities);
