import express, { Request, Response } from 'express';
import bodyParser from "body-parser";

import { startupAllJobs } from "./utils/utils"
import { startDailyPracticeJob } from './utils/utils';
import { dateToCron } from './utils/utils';

const server = express();
server.use(bodyParser.json());

const allJobs = await startupAllJobs();

server.post('/events', async (req: Request, res: Response) => {
  console.log('Received Event:', req.body.type);

  const { data, type } = req.body;

  if (type === 'UserMessageSent') {
      const { userId, date } = data;
      
      // stop  old job if exists
      if (allJobs.dailyPractice[userId]) {
        allJobs.dailyPractice[userId].stop();
        delete allJobs.dailyPractice[userId];
      }

      // start a new job
      const setStartDate = dateToCron(new Date(new Date(date).getTime() + 20 * 60 * 60 * 1000.0));
      let job = startDailyPracticeJob(setStartDate, userId);
      allJobs.dailyPractice[userId] = job;
  }

  res.status(200).send({});
})

// Throw error for requests that are not part of the valid routes
server.get("/ready", (req, res) => {
  res.status(200).send();
});

server.get("/live", (req, res) => {
  res.status(200).send();
});

server.get("*", (req, res) => {
  res.status(404).send("You seem to be lost, did you try waze?");
});


export { server };