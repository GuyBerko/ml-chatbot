import express, { Request, Response } from "express";
import { Users } from "../models/user";
//import { BotAgent } from "../models/botAgent";
import { Interactions } from "../models/interactions";
import { UserMetrics, UserSessions } from "../utils/types";
import errors from "../utils/errors";
import { Sessions } from "../models/sessions";
import dayjs, { Dayjs } from "dayjs";
import { getToday } from "../utils";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const router = express.Router();

const getDate = (date: string): Dayjs => dayjs.utc(date, "YYYY-MM-DD");

router.put("/analytics/subscription", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send(errors[400]);
    }

    const session = await Sessions.findOne({ userId }).sort({
      createdAt: "desc",
    });

    if (!session) {
      return res.status(404).send(errors[404]);
    }

    session.didExceededInteractionLimit = true;
    session.paymentRequestTime = dayjs().utc().toDate();

    await session.save();
  } catch (err) {
    console.error(
      `[AnalyticsRouter] GET - /analytics, Error: ${JSON.stringify(err)}`
    );
    res.status(500).send(errors[500]);
  }
});

router.get("/analytics/monthlySummary", async (req: Request, res: Response) => {
  try {
    const { date = getToday() } = req.query;

    const formatedDate = getDate(date.toString());
    const startOfTheDay = formatedDate.startOf("day");
    const endOfTheDay = formatedDate.endOf("day");
    const startOfLastWeek = startOfTheDay.subtract(1, "week");
    const startOfLastMonth = startOfTheDay.subtract(1, "month");

    const oneDayUsers = await Sessions.find({
      createdAt: {
        $gte: startOfTheDay,
        $lte: endOfTheDay,
      },
    }).distinct("userId");

    const oneWeekUsers = await Sessions.find({
      createdAt: {
        $gte: startOfLastWeek,
        $lte: endOfTheDay,
      },
    }).distinct("userId");

    const oneMonthUsers = await Sessions.find({
      createdAt: {
        $gte: startOfLastMonth,
        $lte: endOfTheDay,
      },
    }).distinct("userId");

    const data = {
      totalDailyActiveUsers: 0,
      totalWeeklyActiveUsers: 0,
      totalMonthlyActiveUsers: 0,
      totalDailyNonActiveUsers: 0,
      totalWeeklyNonActiveUsers: 0,
      totalMonthlyNonActiveUsers: 0,
    };

    for (const userId of oneDayUsers) {
      const dailyUser = await Users.findOne({ userId });
      if (dailyUser?.totalInteractions) {
        data.totalDailyActiveUsers += 1;
      } else {
        data.totalDailyNonActiveUsers += 1;
      }
    }

    for (const userId of oneWeekUsers) {
      const weeklyUser = await Users.findOne({ userId });
      if (weeklyUser?.totalInteractions) {
        data.totalWeeklyActiveUsers += 1;
      } else {
        data.totalWeeklyNonActiveUsers += 1;
      }
    }

    for (const userId of oneMonthUsers) {
      const monthlyUser = await Users.findOne({ userId });
      if (monthlyUser?.totalInteractions) {
        data.totalMonthlyActiveUsers += 1;
      } else {
        data.totalMonthlyNonActiveUsers += 1;
      }
    }

    res.status(200).send(data);
  } catch (err) {
    console.error(
      `[AnalyticsRouter] GET - /analytics/monthlySummary, Error: ${JSON.stringify(
        err
      )}`
    );
    res.status(500).send(errors[500]);
  }
});

router.get("/analytics/summary", async (req: Request, res: Response) => {
  try {
    const { date = getToday() } = req.query;
    const formatedDate = getDate(date.toString());
    const startOfTheDay = formatedDate.startOf("day");
    const endOfTheDay = formatedDate.endOf("day");
    const startOfYesterday = startOfTheDay.subtract(1, "day");
    const sessions = await Sessions.find({
      createdAt: {
        $gte: startOfTheDay,
        $lte: endOfTheDay,
      },
    }).distinct("userId");

    if (!sessions) {
      return res.status(404).send(errors[404]);
    }

    const users = await Users.find({ userId: { $in: sessions } });

    let totalReturned = 0;
    let returnedFromYesterday = 0;
    let newUsers = 0;

    for (const user of users) {
      const createdAt = dayjs(user.createdAt);
      if (createdAt < startOfTheDay) totalReturned++;
      if (createdAt < startOfTheDay && createdAt > startOfYesterday)
        returnedFromYesterday++;
      if (createdAt > startOfTheDay && createdAt < endOfTheDay) newUsers++;
    }

    const data = {
      totalSum: sessions.length,
      totalReturned,
      returnedFromYesterday,
      newUsers,
    };
    res.status(200).send(data);
  } catch (err) {
    console.error(
      `[AnalyticsRouter] GET - /analytics/summary, Error: ${JSON.stringify(
        err
      )}`
    );
    res.status(500).send(errors[500]);
  }
});

router.post("/analytics/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send(errors[400]);
    }

    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(404).send(errors[404]);
    }

    const { platform, messageType, userMessage, botReplay, adId } = req.body;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`

    const interaction = await Interactions.create({
      userName: fullName,
      userPhoneNumber: user.phoneNumber,
      date: dayjs().utc().toDate(),
      userId,
      platform,
      messageType,
      userMessage,
      botReplay,
      adId,
    });

    await interaction.save();

    res.status(202).send("OK");
  } catch (err) {
    console.error(
      `[AnalyticsRouter] PUT - /analytics/:userId, Error: ${JSON.stringify(
        err
      )}`
    );
    res.status(500).send(errors[500]);
  }
});

/*
router.get("/analytics/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send(errors[400]);
    }

    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(404).send(errors[404]);
    }

    let data: any = {};

    const agent = await BotAgent.findOne({ userId: user.userId });
    const metrics = await TelegramMetrics.find({ userId: user.userId });
    const sessions = await Sessions.find({ userId: user.userId });

    if (!agent) {
      return res.status(404).send(errors[404]);
    }

    let userMetrics: UserMetrics = {};
    let userSessions: UserSessions = {};
    let counter = 0;

    for (const metric of metrics) {
      const key = metric.date || `${metric.createdAt} - ${counter++}`;
      userMetrics[key] = {
        interactionsCount: metric.interactionsCount,
        correctionCount: metric.correctionCount,
        questionsCount: metric.questionsCount,
        avgCharactersPerInput: metric.avgCharactersPerInput,
        createdAt: metric.createdAt,
      };
    }

    for (const session of sessions) {
      const duration = session.logoutDate
        ? dayjs(session.logoutDate).diff(dayjs(session.loginDate), "minute") +
          " Minutes"
        : "Still in progress";
      userSessions[session.id] = {
        loginDate: session.loginDate,
        logoutDate: session.logoutDate,
        sessionDuration: duration,
        interactionsCount: session.interactionsCount,
        didExceededInteractionLimit: session.didExceededInteractionLimit
      };
    }

    data[user.userId] = {
      userId: user.userId,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`,
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
      userMetrics,
      userSessions,
    };

    res.status(200).send(data);
  } catch (err) {
    console.error(
      `[AnalyticsRouter] GET - /analytics/:userId, Error: ${JSON.stringify(
        err
      )}`
    );
    res.status(500).send(errors[500]);
  }
});

router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const users = await Users.find();

    if (!users) {
      return res.status(404).send(errors[404]);
    }

    let data: any = {};

    for (const user of users) {
      try {
        const agent = await BotAgent.findOne({ userId: user.userId });
        const metrics = await TelegramMetrics.find({ userId: user.userId });
        const sessions = await Sessions.find({ userId: user.userId });

        if (!agent) {
          continue;
        }

        let userMetrics: UserMetrics = {};
        let userSessions: UserSessions = {};
        let counter = 0;

        for (const metric of metrics) {
          const key = metric.date || `${metric.createdAt} - ${counter++}`;
          userMetrics[key] = {
            interactionsCount: metric.interactionsCount,
            correctionCount: metric.correctionCount,
            questionsCount: metric.questionsCount,
            avgCharactersPerInput: metric.avgCharactersPerInput,
            createdAt: metric.createdAt,
          };
        }

        for (const session of sessions) {
          const duration = session.logoutDate
            ? dayjs(session.logoutDate).diff(
                dayjs(session.loginDate),
                "minute"
              ) + " Minutes"
            : "Still in progress";
          userSessions[session.id] = {
            loginDate: session.loginDate,
            logoutDate: session.logoutDate,
            sessionDuration: duration,
            interactionsCount: session.interactionsCount,
            didExceededInteractionLimit: session.didExceededInteractionLimit
          };
        }

        data[user.userId] = {
          userId: user.userId,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`,
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
          userMetrics,
          userSessions,
        };
      } catch (err) {
        console.error(err);
        res.status(500).send(errors[500]);
      }
    }
    res.status(200).send(data);
  } catch (err) {
    console.error(
      `[AnalyticsRouter] GET - /analytics, Error: ${JSON.stringify(err)}`
    );
    res.status(500).send(errors[500]);
  }
});*/

export { router as analyticsRouter };
