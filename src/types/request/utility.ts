import { Request } from "express";

export interface CreateUtilityBody {
  name: string;
  price: number;
  icon?: string;
  status?: boolean;
  hotelId: string;
}

export interface UpdateUtilityBody {
  name?: string;
  price?: number;
  icon?: string;
  status?: boolean;
  hotelId?: string;
}

export interface CreateUtilityRequest extends Request {
  body: CreateUtilityBody;
}

export interface UpdateUtilityRequest extends Request {
  body: UpdateUtilityBody;
}
