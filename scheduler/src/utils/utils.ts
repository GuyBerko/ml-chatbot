import cron from 'node-cron';

import { getAllUsers } from "./api";
import { User } from "../types/users.types";
import { AllJobs } from "../types/jobs.types";
import { dailyPractice } from "../schedulers/daily-practice";
import { ScheduledTask } from "node-cron";

export const dateToCron = (date: Date) => {
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    return `${seconds} ${minutes} ${hours} ${days} ${months} ${dayOfWeek}`;
};

export const startDailyPracticeJob = (setStartDate: string, userId: number): ScheduledTask => {
    let job = cron.schedule(setStartDate, () => {dailyPractice(userId)});
    job.start();
    console.log(`[startDailyPracticeJob] userId: ${userId}, setStartDate: ${setStartDate}`)

    return job;
}

export const startupAllJobs = async (): Promise<AllJobs> => {
    const users = await getAllUsers() as User[];
    const allJobs = {
        dailyPractice: {},
    } as AllJobs;

    for (const user of users) {
        // get current date
        let now = new Date();

        //// daily practice ////        
        let lastUserMessageDate = user.lastUserMessageDate ? new Date(user.lastUserMessageDate) : now;
        let lastDailyPractice = user.lastDailyPractice ? new Date(user.lastDailyPractice) : now;
        
        let hoursFromLastUserMessage = (now.getTime() - lastUserMessageDate.getTime()) / (1000.0 * 60 * 60);
        let answeredLastDailyPractice = (lastUserMessageDate.getTime() - lastDailyPractice.getTime()) >= 0 ;

        let startDailyPractice = hoursFromLastUserMessage < 20 && answeredLastDailyPractice;

        if (startDailyPractice) {
            // set start time to 20h after last user message and start job
            let setStartDate = dateToCron(new Date(lastUserMessageDate.getTime() + 20 * 60 * 60 * 1000.0))
            let job = startDailyPracticeJob(setStartDate, user.userId);

            // append job 
            allJobs.dailyPractice[user.userId] = job;
        }    
    }

    return allJobs;
}

