import UtilityModel from "../models/Utility";
import { Types } from "mongoose";
import { CreateUtilityInput } from "../types/request/utility/utility";

export async function findUtilities(filter: Record<string, any> = {}) {
  const _filter: any = filter || {};
  return UtilityModel.find(_filter).sort({ createdAt: -1 }).lean();
}

export async function createUtility(payload: CreateUtilityInput) {
  if (payload.hotelId && typeof payload.hotelId === "string") payload.hotelId = new Types.ObjectId(payload.hotelId);
  const doc = new UtilityModel(payload as any);
  return doc.save();
}

export async function getUtilityById(id: string) {
  return UtilityModel.findById(id).lean();
}

export async function updateUtilityById(id: string, payload: Partial<CreateUtilityInput>) {
  if (payload && (payload as any).hotelId && typeof (payload as any).hotelId === "string") {
    (payload as any).hotelId = new Types.ObjectId((payload as any).hotelId);
  }
  return UtilityModel.findByIdAndUpdate(id, payload, { new: true }).lean();
}

export async function deleteUtilityById(id: string) {
  return UtilityModel.findByIdAndDelete(id);
}
