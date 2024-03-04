/*import express, { Request, Response } from "express";
import { Users } from "../models/user";
//import { BotAgent } from "../models/botAgent";
import errors from "../utils/errors";
import { getToday } from "../utils";

const router = express.Router();


router.put("/chatbot/:userId", async (req: Request, res: Response) => {
  const data = req.body;
  const userId = data.userId;

  if (!userId) {
    return res.status(400).send(errors[400]);
  }

  const botAgentResult = await BotAgent.updateOne({ userId }, { $set: data });

  res.status(201).send(botAgentResult);
});

router.post("/chatBot", async (req: Request, res: Response) => {
  const data = req.body;
  const userId = data.userId;

  if (!userId) {
    return res.status(400).send(errors[400]);
  }

  const botAgent = {
    userId,
    subjectCount: data.subjectCount,
    maxInteractionsPerSubject: data.maxInteractionsPerSubject,
    posFeedbackCount: data.posFeedbackCount,
    lastUserMessageId: data.lastUserMessageId,
    lastBotTextId: data.lastBotTextId,
    lastBotVoiceId: data.lastBotVoiceId,
    openers: data.openers,
    lastUserMessageDate: new Date(data.lastUserMessageDate),
    lastBotTextDate: new Date(data.lastBotTextDate),
    lastBotVoiceDate: new Date(data.lastBotVoiceDate),
    textHistory: data.history,
  };

  const botAgentResult = await BotAgent.updateOne({ userId }, botAgent, {
    upsert: true,
    setDefaultsOnInsert: true,
  });

  res.status(201).send(botAgentResult);
});

router.get("/chatBot/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const date = getToday("DD-MM-YYYY");

  const user = await Users.findOne({ userId });
  const agent = await BotAgent.findOne({ userId });

  if (!user || !agent) {
    return res.status(404).send(errors[404]);
  }

  res.status(200).send({
    userId: user.userId,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`,
    createdAt: user.createdAt ? new Date(user.createdAt).getTime() : 0,
    subjectCount: agent.subjectCount,
    maxInteractionsPerSubject: agent.maxInteractionsPerSubject,
    posFeedbackCount: agent.posFeedbackCount,
    lastUserMessageId: agent.lastUserMessageId,
    lastBotTextId: agent.lastBotTextId,
    lastBotVoiceId: agent.lastBotVoiceId,
    openers: agent.openers,
    lastUserMessageDate: agent.lastUserMessageDate
      ? new Date(agent.lastUserMessageDate).getTime()
      : 0,
    lastBotTextDate: agent.lastBotTextDate
      ? new Date(agent.lastBotTextDate).getTime()
      : 0,
    lastBotVoiceDate: agent.lastBotVoiceDate
      ? new Date(agent.lastBotVoiceDate).getTime()
      : 0,
    history: agent.textHistory,
  });
});

router.get("/chatBots", async (req: Request, res: Response) => {
  const users = await Users.find();

  if (!users) {
    return res.status(404).send(errors[404]);
  }

  let data: any = {};

  for (const user of users) {
    try {
      const agent = await BotAgent.findOne({ userId: user.userId });

      if (!agent) {
        throw new Error("Agent or Metrics not found");
      }

      data[user.userId] = {
        userId: user.userId,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`,
        createdAt: user.createdAt ? new Date(user.createdAt).getTime() : 0,
        subjectCount: agent.subjectCount,
        maxInteractionsPerSubject: agent.maxInteractionsPerSubject,
        posFeedbackCount: agent.posFeedbackCount,
        lastUserMessageId: agent.lastUserMessageId,
        lastBotTextId: agent.lastBotTextId,
        lastBotVoiceId: agent.lastBotVoiceId,
        openers: agent.openers,
        lastUserMessageDate: agent.lastUserMessageDate
          ? new Date(agent.lastUserMessageDate).getTime()
          : 0,
        lastBotTextDate: agent.lastBotTextDate
          ? new Date(agent.lastBotTextDate).getTime()
          : 0,
        lastBotVoiceDate: agent.lastBotVoiceDate
          ? new Date(agent.lastBotVoiceDate).getTime()
          : 0,
        history: agent.textHistory,
      };
    } catch (err) {
      console.log("usersData error user: " + user.userId + " not found");
    }
  }
  res.status(200).send(data);
});

export { router as chatBotRouter };
*/