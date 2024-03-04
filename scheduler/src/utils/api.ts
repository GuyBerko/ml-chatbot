import axios from "axios";
import { User } from "../types/users.types";

export const getAllUsers = async (): Promise<User[] | void> => {
  try {
    const url = `${process.env.USERS_URL}/users`;
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    console.error(`[getAllUserIds] - Error: ${err}`);
  }
};

export const saveDailyPracticeDate = async (data: {
  userId: number;
  lastDailyPractice: Date;
}): Promise<void> => {
  try {
    const url = `${process.env.USERS_URL}/user/${data.userId}`;

    await axios.put(url, data);
  } catch (err) {
    console.error(`[saveDailyPracticeDate] ${err}`);
  }
};