import express, { Request, Response } from "express";
import { Promotions } from "../models/promotions";
import { Offering } from "../models/offering";
import { Users } from "../models/user";
import errors from "../utils/errors";
import { Sessions } from "../models/sessions";
import { PipelineStage } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { dayjs } from "../utils";

const router = express.Router();

router.put("/promotion", async (req: Request, res: Response) => {
  try {
    const { userId, lastShareLink, lastInactivity, lastSubscriptionPromot } =
      req.body;
    const data = {
      userId,
      lastShareLink,
      lastInactivity,
      lastSubscriptionPromot,
    };

    const result = await Promotions.updateOne({ userId }, data, {
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(201).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/promotion/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await Promotions.findOne({ userId });

    if (!result) {
      return res.status(404).send(errors[404]);
    }

    res.status(200).send({
      userId: result.userId,
      lastShareLink: result.lastShareLink
        ? new Date(result.lastShareLink).getTime()
        : 0,
      lastInactivity: result.lastInactivity
        ? new Date(result.lastInactivity).getTime()
        : 0,
      lastSubscriptionPromot: result.lastSubscriptionPromot
        ? new Date(result.lastSubscriptionPromot).getTime()
        : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/promotions", async (req: Request, res: Response) => {
  try {
    const results = await Promotions.find();

    if (!results) {
      return res.status(404).send(errors[404]);
    }

    const data = [];
    for (const result of results) {
      data.push({
        userId: result.userId,
        lastShareLink: result.lastShareLink
          ? new Date(result.lastShareLink).getTime()
          : 0,
        lastInactivity: result.lastInactivity
          ? new Date(result.lastInactivity).getTime()
          : 0,
        lastSubscriptionPromot: result.lastSubscriptionPromot
          ? new Date(result.lastSubscriptionPromot).getTime()
          : 0,
      });
    }

    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.post("/createPromotion", async (req: Request, res: Response) => {
  try {
    const { limit, product, numberOfRequests } = req.query;
    const productId = parseInt(product as string) || 2;
    const count = parseInt(numberOfRequests as string) || 3;

    const notEligibleUsers = await Promotions.find({
      lastSpecialSubscriptionPromot: { $ne: null },
    }).distinct("userId");

    const subscribedUsers = await Users.find({
      subscriptionEndDate: { $gt: dayjs.utc().toDate() },
    }).distinct("userId");

    const pipeline: PipelineStage[] = [
      {
        $group: {
          _id: "$userId",
          count: { $sum: {$cond: [{$not: ["$didExceededInteractionLimit"]}, 0, 1] } },
        },
      },
      // @ts-ignore
      { $match: { count: { $gte: count }, _id: { $nin: notEligibleUsers.concat(subscribedUsers) } } },
    ];

    if (typeof limit === "string" && !isNaN(parseInt(limit)))
      pipeline.push({ $limit: parseInt(limit) });

    const eligibleUsers = await Sessions.aggregate(pipeline);
    const eligibleUsersIds = eligibleUsers.map((user) => user._id);
    const bulkUpdateData = [];

    for (const userId of eligibleUsersIds) {
      bulkUpdateData.push({
        updateOne: {
          filter: { userId },
          update: {
            $set: {
              lastSpecialSubscriptionPromot: new Date().getTime(),
              userId,
            },
          },
          upsert: true,
          setDefaultsOnInsert: true,
        },
      });
    }
    await Promotions.bulkWrite(bulkUpdateData);

    const newOffer = Offering.build({
      offerKey: uuidv4(),
      productId: productId,
      startDate: dayjs.utc().toDate(),
      endDate: dayjs.utc().add(1, "day").toDate(),
      eligibleCount: eligibleUsers.length,
    });

    await newOffer.save();

    res.status(201).send({
      count: eligibleUsersIds.length,
      offerKey: newOffer.offerKey,
      productId: newOffer.productId,
      endDate: new Date(newOffer.endDate).getTime(),
      eligibleUsersIds,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

router.get("/activeOffers", async (req: Request, res: Response) => {
  try {
    const activeOffers = await Offering.find({
      endDate: { $gt: dayjs.utc().toDate() },
    });

    const data = activeOffers.map((offer) => ({
      offerKey: offer.offerKey,
      productId: offer.productId,
      startDate: new Date(offer.startDate).getTime(),
      endDate: new Date(offer.endDate).getTime(),
      eligibleCount: offer.eligibleCount,
    }));

    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send(errors[500]);
  }
});

export { router as promotionsRouter };
