import { Users } from "../models/Users";

export async function getUserByUserName(username: string) {
  const user = await Users.findOne({ username });
  return user;
}
