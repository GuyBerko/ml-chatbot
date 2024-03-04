import mongoose from "mongoose";
import dotenv from "dotenv";
import { Users } from "../models/user";
/*import { TelegramMetrics } from "../models/interactions";

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI!);

  //get all users with no interactions
  const users = await Users.find({
    $or: [
      { totalInteractions: 0 },
      { totalInteractions: { $exists: false } },
      { totalInteractions: null },
    ],
  });

  console.log(`got ${users.length} users to update`);

  const updatePromiseArray = [];

  for (const user of users) {
    console.log(`start updating user: ${user.userId}`);

    let interactions = 0;

    const metrics = await TelegramMetrics.find({ userId: user.userId });

    for (const metric of metrics) {
      interactions += metric.interactionsCount || 0;
    }

    user.totalInteractions = interactions;

    updatePromiseArray.push(user.save());
  }

  await Promise.all(updatePromiseArray);

  console.log("finish update");
})();
*/