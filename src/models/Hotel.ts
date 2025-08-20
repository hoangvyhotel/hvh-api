// define the schema for a hotel model in a MongoDB database using Mongoose

import { Document, model, Schema } from "mongoose";

interface IHotel {
  name: string;
  username: string;
  password: string;
  passwordManage: string;
  role: string;
}

export interface IHotelDocument extends IHotel, Document {}

const hotelSchema = new Schema<IHotelDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    passwordManage: { type: String, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

// export const HotelModel = model<IHotelDocument>("Hotel", hotelSchema);
