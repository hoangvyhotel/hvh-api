import { Request } from "express";
interface UserPayload {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: string;
}
interface CustomRequest<T> extends Request {
  body: T;
  user?: UserPayload;
}
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
