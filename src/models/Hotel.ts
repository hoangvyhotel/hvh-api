// define the schema for a hotel model in a MongoDB database using Mongoose

import { Document, model, Schema } from "mongoose";

interface IHotel {
  name: string;
}

export interface IHotelDocument extends IHotel, Document {}

const hotelSchema = new Schema<IHotelDocument>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const HotelModel = model<IHotelDocument>("Hotel", hotelSchema);
