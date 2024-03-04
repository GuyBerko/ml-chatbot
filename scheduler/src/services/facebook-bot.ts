import axios from "axios";

export const sendMessage = (userId: number, message: string) => {
    const url = `${process.env.FACEBOOK_URL}/user/send-message-to-nlu`;
    const data = { userId, message };
    
    try {
        axios.post(url, data);
        console.log(`Sent message "${message}" to NLU via FB-BOT to user ID ${userId}`);
    } catch (err) {
        console.error(err);
    }
}
