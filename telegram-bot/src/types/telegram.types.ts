import { Context } from "telegraf";
import { User } from "./users.types";

export interface TelegramContext extends Context {
  user: User;
}
