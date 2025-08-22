
import { Document, model, Schema, Types } from "mongoose";

interface IExpenses {
    date: Date;
    amount: number;
    reason: string;
    note?: string;
    hotelId:  Schema.Types.ObjectId;
}

export interface IExpensesDocument extends IExpenses, Document<Types.ObjectId> {}

const hotelSchema = new Schema<IExpensesDocument>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    note: { type: String, default: "" },
    hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true }
  },
  { timestamps: true, collection: "expenses"  }
);

export const ExpensesModel = model<IExpensesDocument>("expenses", hotelSchema);
