import { ScheduledTask } from "node-cron";

export interface AllJobs {
    dailyPractice: { [key: number]: ScheduledTask };
}