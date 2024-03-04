import express, { Request, Response } from "express";
import { bot } from '../services/telegram';

const BOT_TOKEN = process.env.BOT_TOKEN;
const router = express.Router();



export { router as telegramRouter };
