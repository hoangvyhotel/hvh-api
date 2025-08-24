import mongoose, { Document } from "mongoose";

export interface IOrderItem {
  quantity: number;
  roomId: mongoose.Types.ObjectId;
  utilitiesId: mongoose.Types.ObjectId;
}

export interface IOrderItemModel extends IOrderItem, Document {}

const OrderItemSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  utilitiesId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilities" },
});

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);

export default OrderItem;
