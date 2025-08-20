import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  utilitiesId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilities" },
});

module.exports = mongoose.model("OrderItem", OrderItemSchema);
