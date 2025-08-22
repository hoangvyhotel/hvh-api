export interface IUsers {
  username: string;
  password: string;
  passwordManage: string;
  role: string;
  hotelId: mongoose.Types.ObjectId;
}

import mongoose, { Schema, model, Document } from "mongoose";

export interface IUsersDocument extends IUsers, Document {}

const usersSchema = new Schema<IUsersDocument>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    passwordManage: { type: String, required: true },
    role: { type: String, required: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true }
);

export const Users = model<IUsersDocument>("users", usersSchema);
