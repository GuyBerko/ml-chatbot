import express, { Request, Response } from "express";
import { Users, UsersDoc } from "../models/user";
import { Sessions } from "../models/sessions";
import errors from "../utils/errors";
import { getToday } from "../utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const router = express.Router();

router.post("/user", async (req: Request, res: Response) => {
  const data = req.body;
  const {
    userId,
    firstName,
    lastName,
    phoneNumber,
    creationPlatform,
    authorized,
    chatId,
  } = data;

  if (!userId) {
    return res.status(400).send(errors[400]);
  }

  try {
    const user = {
      userId,
      firstName,
      lastName,
      phoneNumber,
      creationPlatform,
      authorized,
      chatId,
      online: true,
      numberOfSessions: 1,
    };

    const userData = await Users.updateOne({ userId }, user, {
      upsert: true,
      setDefaultsOnInsert: true,
    }); // TODO: replace with build

    res.status(201).send(userData);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.put("/user/:userId", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send(errors[400]);
    }
    const userResult = await Users.updateOne({ userId }, { $set: data });

    res.status(201).send(userResult);
  } catch (err: any) {
    console.error(`PUT /user/:userId - ${err?.stack}`);
  }
});

router.post("/user/login", async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send(errors[400]);
  }

  try {
    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(404).send(errors[404]);
    }

    const numberOfSessions = user.numberOfSessions + 1;
    const loginDate = dayjs().utc().toDate();

    await Users.updateOne(
      { userId },
      {
        online: true,
        numberOfSessions,
      }
    );

    const session = Sessions.build({
      userId,
      loginDate,
    });

    await session.save();

    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.post("/user/logout", async (req: Request, res: Response) => {
  const { userId, interactionsCount } = req.body;

  if (!userId) {
    return res.status(400).send(errors[400]);
  }

  try {
    const user = await Users.findOne({ userId });
    const session = await Sessions.findOne({ userId }).sort({
      createdAt: "desc",
    });

    if (!user || !session) {
      return res.status(404).send(errors[404]);
    }

    user.online = false;
    user.totalInteractions = user.totalInteractions + interactionsCount;

    session.logoutDate = dayjs().utc().toDate();
    session.interactionsCount = interactionsCount;

    await Promise.all([user.save(), session.save()]);

    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/user/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(404).send(errors[404]);
    }

    const date = getToday("DD-MM-YYYY");

    res.status(200).send({
      userId: user.userId,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`,
      createdAt: user.createdAt ? new Date(user.createdAt).getTime() : 0,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      creationPlatform: user.creationPlatform,
      authorized: user.authorized,
      chatId: user.chatId,
      online: user.online,
      numberOfSessions: user.numberOfSessions,
      lastUserMessageId: user.lastUserMessageId,
      totalInteractions: user.totalInteractions,
      lastBotTextId: user.lastBotTextId,
      lastBotVoiceId: user.lastBotVoiceId,
      recivedOnBoard: user.recivedOnBoard,
      isSubscribe: user.subscriptionEndDate
        ? new Date(user.subscriptionEndDate) > new Date()
        : false,
      lang: user.lang,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await Users.find();

    if (!users) {
      return res.status(404).send(errors[404]);
    }

    const date = getToday("DD-MM-YYYY");
    const usersData = [];

    for (const user of users) {
      usersData.push({
        userId: user.userId,
        createdAt: user.createdAt ? new Date(user.createdAt).getTime() : 0,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        creationPlatform: user.creationPlatform,
        authorized: user.authorized,
        chatId: user.chatId,
        online: user.online,
        numberOfSessions: user.numberOfSessions,
        recivedOnBoard: user.recivedOnBoard,
        isSubscribe: user.subscriptionEndDate
          ? new Date(user.subscriptionEndDate) > new Date()
          : false,
        lastUserMessageDate: user.lastUserMessageDate,
        lastDailyPractice: user.lastDailyPractice,
      });
    }

    res.status(200).send(usersData);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/users/ids", async (req: Request, res: Response) => {
  try {
    const users_ids = await Users.find({}, {userId: 1, _id: 0});

    if (!users_ids) {
      return res.status(404).send(errors[404]);
    }

    res.status(200).send(users_ids);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

export { router as userRouter };
