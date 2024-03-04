import { sendMessage } from '../services/facebook-bot';
import { saveDailyPracticeDate } from '../utils/api';

const dailyPractice = async (userId: number): Promise<void> => {
    // send daily practice message
    sendMessage(userId, '/daily_practice');

    // save date
    await saveDailyPracticeDate({ userId, lastDailyPractice: new Date()});

    console.log(`[dailyPractice] userId: ${userId}`);
}

export { dailyPractice }
