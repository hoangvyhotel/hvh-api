export interface IUsers {
  username: string;
  password: string;
  passwordManage: string;
  role: string;
}

import { Schema, model, Document } from 'mongoose';

export interface IUsersDocument extends IUsers, Document {}

const usersSchema = new Schema<IUsersDocument>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  passwordManage: { type: String, required: true },
  role: { type: String, required: true },
}, { timestamps: true });

export const Users = model<IUsersDocument>('users', usersSchema);
