import { Types } from "mongoose";

export interface CreateUtilityInput {
  name: string;
  price: number;
  icon?: string;
  status?: boolean;
  hotelId: Types.ObjectId | string;
}

export interface UpdateUtilityInput {
  name?: string;
  price?: number;
  icon?: string;
  status?: boolean;
  hotelId?: Types.ObjectId | string;
}
