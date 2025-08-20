import { Document, model, Schema } from "mongoose";

// step 1: Define the interface for the Room model
// step 2: Define Document interface mapping from schema to collection
// step 3: Create the schema for the Room model using Schema from Mongoose
// step 4: Export the model for use in other parts of the application

interface IRoom {
  floor: number;
  originalPrice: number;
  afterHoursPrice: number;
  dayPrice: number;
  nightPrice: number;
  description: string;
  typeHire: number; // Assuming this is an enum or a specific set of values
  status: boolean; // true for available, false for not available
  hotelId: Schema.Types.ObjectId; // Reference to the Hotel model
}

export interface IRoomDocument extends IRoom, Document {}

const roomSchema = new Schema<IRoomDocument>(
  {
    floor: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    afterHoursPrice: { type: Number, required: true },
    dayPrice: { type: Number, required: true },
    nightPrice: { type: Number, required: true },
    description: { type: String, required: true },
    typeHire: { type: Number, required: true },
    status: { type: Boolean, required: true },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true }
);

export const RoomModel = model<IRoomDocument>("Room", roomSchema);
