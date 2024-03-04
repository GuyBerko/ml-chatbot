import express, { Request, Response } from "express";
import { getUser } from "../utils/api"
import { getMessage } from "../services/chatbotService";
import { getAudioFromText } from "../services/ttsService";
import { checkSpecialText } from "../utils/utils"
import { getClient } from "bottender";

const router = express.Router();

const client = getClient("messenger");

router.post("/user/send-message-to-nlu", async (req: Request, res: Response) => {
    // extract params
    const { userId, message } = req.body;

    // find user in database  
    const user = await getUser(userId);

    // if user does not exist return error
    if (!user) {
        return res.status(500).send('Did not find user');
    }

    // check for special text (commands)
    const stop = await checkSpecialText(user, message);
    if (stop) { return res.status(200); }

    // get the bot response
    const botResponse = await getMessage(message, user.userId);

    // if no bot response return error 
    if (!botResponse || !botResponse.replay) {
        return res.status(500).send('Did not get bot response');
    }

    // get language code
    const languageCode = user.lang || "en-US"  // english is default

    // get audio bot response
    const audioReplay = await getAudioFromText(botResponse.replay, languageCode);

    const recipient = userId.toString();

    // send text
    client.sendText(recipient, botResponse.replay)

    // send audio
    client.sendAudio(recipient, audioReplay, {
        // @ts-ignore
        filename: "audio.mp3",
      });
    
    res.status(200);
})

export { router as userRouter };