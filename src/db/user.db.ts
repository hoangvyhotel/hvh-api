import { startSession, Types } from "mongoose";
import { HotelModel } from "@/models/Hotel";
import {
  ChangePasswordBodyRequest,
  RegisterCredentials,
  RegisterRequest,
} from "@/types/request";
import { IUsers, Users } from "../models/Users";

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
export async function createUser(userData: RegisterCredentials): Promise<void> {
  const newUser = new Users({
    username: userData.username,
    password: userData.password,
    passwordManage: userData.passwordManage,
  });

  await newUser.save();
}

export async function updateUserPassword(
  userId: string,
  hasedPassword: string
): Promise<void> {
  await Users.findByIdAndUpdate(userId, { password: hasedPassword });
}

export async function deleteUser(userId: string): Promise<void> {
  await Users.findByIdAndDelete(userId);
}
