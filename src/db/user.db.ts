import { startSession, Types } from "mongoose";
import { Users } from "../models/Users";
import { HotelModel } from "@/models/Hotel";

export async function getUserByUserName(username: string) {
  const user = await Users.findOne({ username });
  return user;
}

export const registerUserWithHotel = async (
  username: string,
  hashedPassword: string,
  hashedPasswordManage: string,
  hotelName: string
) => {
  try {
    const newHotel = new HotelModel({ name: hotelName });
    const savedHotel = await newHotel.save();

    const newUser = new Users({
      username,
      password: hashedPassword,
      passwordManage: hashedPasswordManage,
      role: "STAFF",
      hotelId: savedHotel._id as Types.ObjectId,
    });

    const savedUser = await newUser.save();

    return { savedUser, savedHotel };
  } catch (error) {
    throw error;
  }
};
