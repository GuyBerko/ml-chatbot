import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import { getTranscription } from "./sttService";
import { getAudioFromText } from "./ttsService";
import { getMessage } from "./chatbotService";
import config from "../utils/config";
import fs from "fs";
import {
  getUser,
  createUser,
  checkSpelling,
  saveUserData,
  saveUserMetrics,
  createPaymentUrl,
} from "../utils/api";
import { TelegramContext } from "../types/telegram.types";
import { getSplitMessage } from "../utils/telegram";
import localtunnel from "localtunnel";

const TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || 0;
const bot = new Telegraf<TelegramContext>(TOKEN);
const secretPath = `/telegraf/${bot.secretPathComponent()}`;
const MY_NERVES_LIMIT = 5 * 60; // five minutes is all you get bruh. don't be tellin stories

// validate user
bot.use(async (ctx, next): Promise<void> => {
  if (!ctx.from || ctx.from.is_bot) {
    ctx.reply("You are not a valid user.");
    return;
  }
  const { id: userId, first_name, last_name } = ctx.from;

  // try to fetch user from users service
  // if no user create new one
  const user =
    (await getUser(userId)) ||
    (await createUser({
      userId,
      firstName: first_name,
      lastName: last_name,
      fullName: `${first_name || ""} ${last_name || ""}`,
      isNew: true,
      isSubscribe: false,
      authorized: true,
      interactionsCount: 0,
      creationPlatform: "telegram",
    }));

  // if no user found or created return error
  if (!user) {
    ctx.reply(
      "Error: could not create new user please try again or contact support."
    );
    return;
  }

  if (!user.authorized) {
    ctx.reply(
      "You are not authorized to use this bot,\nplease contact support to activate your user."
    );
    return;
  }

  const createdAt = user.createdAt || new Date().getTime();

  if (
    !user.isSubscribe &&
    new Date().getTime() - createdAt > config.bot.maxFreeInteraction
  ) {
    //@ts-ignore
    const { message_id, text } = ctx.message || {};
    const paymentUrl = await createPaymentUrl(userId, text, message_id);

    if (!paymentUrl) {
      throw Error("could not create payment url");
    }

    const keyboard = Markup.inlineKeyboard([
      Markup.button.url("Subscribe", paymentUrl, false),
    ]);

    ctx.reply(
      "Your 3 day trial is over 😟,\n Click here for unlimited access 😁",
      keyboard
    );
    return;
  }

  ctx.user = user;

  await next();
});

bot.start(async (ctx) => {
  const { first_name } = ctx.from;
  const onBoardMsg = `Hi ${first_name},\n\n${config.texts.onBoardMessage}`;

  ctx.replyWithChatAction("record_voice");

  const audioReplay = await getAudioFromText(onBoardMsg);

  // replay the audio
  ctx.replyWithVoice({
    source: audioReplay,
  });
  ctx.reply(onBoardMsg);
});

bot.on("text", async (ctx): Promise<void> => {
  const {
    message: { message_id, text, reply_to_message },
    user,
  } = ctx;
  const isEdit = !!reply_to_message;
  const messageId = isEdit ? reply_to_message.message_id : message_id;

  console.log(`got new message text from ${user.fullName}`);

  // start recording action
  ctx.replyWithChatAction("record_voice");

  // if text is empty
  if (!text) {
    console.error(`[onText] - didnot recived text message`);
    ctx.reply("Sorry i dont understand what you tring to say.");
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  // get the bot response
  const botResponse = await getMessage(
    text,
    user.fullName,
    user.userId,
    messageId,
    isEdit
  );

  // if no bot response return error (maybe try again? and what about deleting the message?)
  if (!botResponse) {
    console.error(`[onText] - couldnot get bot replay`); // TODO: add error to log
    ctx.reply(
      "Sorry i couldnot understand what you try to say, please speak clearer and send again."
    );
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  if (botResponse.errorCode || !botResponse.replay) {
    console.error(
      `[onText] - Error getting bot response code: ${botResponse.errorCode}`
    );
    ctx.reply(botResponse.errorMessage || "");
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  if (isEdit) {
    ctx.deleteMessage(user.lastBotTextId);
    ctx.deleteMessage(user.lastBotVoiceId);
  }

  // get spelling currection
  if (config.bot.useCorrection) {
    const textCurrection = await checkSpelling(text);
    if (textCurrection?.foundSpellingError) {
      try {
        ctx.replyWithHTML(`<u>Tip</u>: ${textCurrection.inputTextHtml}`);
        ctx.reply("Reply to your last message to edit it and practice :-)");
      } catch (err) {
        const error = `Error reply_html: ${err}. original message: ${text}. html message: ${textCurrection.inputTextHtml}`;
        console.error(error);
        bot.telegram.sendMessage(ADMIN_CHAT_ID, error);
      }
      ctx.replyWithChatAction("record_voice");
    }
  }

  // get array of the split message
  const replies = getSplitMessage(botResponse.replay);
  let lastBotTextId, lastBotVoiceId;

  for (const reply of replies) {
    // get the bot response in audio
    const audioReplay = await getAudioFromText(reply);

    // replay the audio
    const textResPromise = ctx.reply(reply);
    const voiceResPromise = ctx.replyWithVoice({
      source: audioReplay,
    });

    await Promise.all([textResPromise, voiceResPromise]).then(
      ([textRes, voiceRes]) => {
        lastBotTextId = textRes.message_id;
        lastBotVoiceId = voiceRes.message_id;
      }
    );
  }

  await Promise.all([
    saveUserData({
      userId: user.userId,
      lastBotTextId,
      lastBotVoiceId,
      lastUserMessageId: messageId,
    }),
    saveUserMetrics({
      userId: user.userId,
      platform: "telegram",
      messageType: "text",
      userMessage: text,
      botReplay: botResponse.replay,
    }),
  ]);
});

bot.on("voice", async (ctx): Promise<void> => {
  const {
    message: { message_id, voice, reply_to_message },
    user,
  } = ctx;

  const isEdit = !!reply_to_message;
  const messageId = isEdit ? reply_to_message.message_id : message_id;

  console.log(`got new message voice from ${user.fullName}`);

  // if the voice duration is too long return an error
  if (voice.duration > MY_NERVES_LIMIT) {
    console.error(
      `[onVoice] - audio content length is too long. ${voice.duration} sec!`
    );
    ctx.reply("Sorry, but no messages longer than 5 minutes.");
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  // start recording action
  ctx.replyWithChatAction("record_voice");

  // get the voice audio link
  const link = await ctx.telegram.getFileLink(voice.file_id);
  // download the audio as buffer and covert it to base 64
  const response = await axios.get(link.href, { responseType: "arraybuffer" });
  const audioContent = Buffer.from(response.data, "binary").toString("base64");
  console.log("finish download audio");
  // if audioContent length is 0 return error
  if (!audioContent.length) {
    console.error(`[onVoice] - audio content length is zero`);
    ctx.reply("Sorry i couldnot get the voice message please send again.");
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  // Save the file localy
  const filePath = `${process.cwd()}/voice_messages/${
    user.userId
  }-${messageId}.ogg`;
  fs.writeFileSync(filePath, Buffer.from(response.data));

  // get the transcription of the audio
  const { transcription, path } =
    (await getTranscription(audioContent, filePath)) || {};

  if (!path) {
    console.error(`[onVoice] - couldnot get transcription from audio`);
    ctx.reply(
      "Sorry i couldnot understand what you try to say, please speak clearer and send again."
    );

    return;
  }

  // if transcription is empty return error
  if (!transcription) {
    console.error(`[onVoice] - couldnot get transcription from audio`);
    ctx.reply(
      "Sorry i couldnot understand what you try to say, please speak clearer and send again."
    );

    return;
  }

  fs.unlink(filePath, () => {
    console.log("finish deleting voice");
  });

  //ctx.reply(`stt: ${transcription}`);
  ctx.replyWithChatAction("record_voice");

  // get the bot response
  const botResponse = await getMessage(
    transcription,
    user.fullName,
    user.userId,
    messageId,
    isEdit
  );

  // if no bot response return error (maybe try again? and what about deleting the message?)
  if (!botResponse) {
    console.error(`[onVoice] - couldnot get bot replay`); // TODO: add error to log
    ctx.reply(
      "Sorry i couldnot understand what you try to say, please speak clearer and send again."
    );
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  if (botResponse.errorCode || !botResponse.replay) {
    console.error(
      `[onVoice] - Error getting bot response code: ${botResponse.errorCode}`
    );
    ctx.reply(botResponse.errorMessage || "");
    ctx.deleteMessage(ctx.message.message_id);
    return;
  }

  if (isEdit) {
    ctx.deleteMessage(user.lastBotTextId);
    ctx.deleteMessage(user.lastBotVoiceId);
  }

  // get spelling currection
  if (config.bot.useCorrection) {
    const textCurrection = await checkSpelling(transcription, true, true);
    
    if (textCurrection?.foundSpellingError) {
      try {
        ctx.replyWithHTML(`<u>Tip</u>: ${textCurrection.inputTextHtml}`);
        ctx.reply("Reply to your last message to edit it and practice :-)");
      } catch (err) {
        const error = `Error reply_html: ${err}. original message: ${transcription}. html message: ${textCurrection.inputTextHtml}`;
        console.error(error);
        bot.telegram.sendMessage(ADMIN_CHAT_ID, error);
      }
      ctx.replyWithChatAction("record_voice");
    }
  }

  // get array of the split message
  const replies = getSplitMessage(botResponse.replay);
  let lastBotTextId, lastBotVoiceId;

  for (const reply of replies) {
    // get the bot response in audio
    const audioReplay = await getAudioFromText(reply);
    
    // replay the audio
    const textResPromise = ctx.reply(reply);
    const voiceResPromise = ctx.replyWithVoice({
      source: audioReplay,
    });

    await Promise.all([textResPromise, voiceResPromise]).then(
      ([textRes, voiceRes]) => {
        lastBotTextId = textRes.message_id;
        lastBotVoiceId = voiceRes.message_id;
      }
    );
  }

  await Promise.all([
    saveUserData({
      userId: user.userId,
      lastBotTextId,
      lastBotVoiceId,
      lastUserMessageId: messageId,
    }),
    saveUserMetrics({
      userId: user.userId,
      platform: "telegram",
      messageType: "voice",
      userMessage: transcription,
      botReplay: botResponse.replay,
    }),
  ]);
});

bot.catch((err, ctx): void => {
  bot.telegram.sendMessage(ADMIN_CHAT_ID, JSON.stringify(err));
  ctx.reply(
    "We are sorry but we seems to have an issue please try again or contact support."
  );
  console.error(JSON.stringify(err));
});

const resumeChat = async (
  userId: number,
  lastMessage: string,
  messageId: number
): Promise<void> => {
  const user = await getUser(userId);
  if (!user) return;
  const fullName = user.fullName;

  bot.telegram.sendChatAction(userId, "record_voice");

  const botResponse = await getMessage(
    lastMessage,
    fullName,
    userId,
    messageId,
    false
  );

  // if no bot response return error (maybe try again? and what about deleting the message?)
  if (!botResponse) {
    console.error(`[resumeChat] - couldnot get bot replay`);
    bot.telegram.sendMessage(
      userId,
      "Sorry i couldnot understand what you try to say, please speak clearer and send again."
    );
    return;
  }

  if (botResponse.errorCode || !botResponse.replay) {
    console.error(
      `[onVoice] - Error getting bot response code: ${botResponse.errorCode}`
    );
    bot.telegram.sendMessage(userId, botResponse.errorMessage || "");
    return;
  }

  // get array of the split message
  const replies = getSplitMessage(botResponse.replay);
  let lastBotTextId, lastBotVoiceId;

  for (const reply of replies) {
    // get the bot response in audio
    const audioReplay = await getAudioFromText(reply);
    console.log("got response audio");
    // replay the audio
    const textResPromise = bot.telegram.sendMessage(userId, reply);
    const voiceResPromise = bot.telegram.sendVoice(userId, {
      source: audioReplay,
    });

    await Promise.all([textResPromise, voiceResPromise]).then(
      ([textRes, voiceRes]) => {
        lastBotTextId = textRes.message_id;
        lastBotVoiceId = voiceRes.message_id;
      }
    );
  }

  await Promise.all([
    saveUserData({
      userId,
      lastBotTextId,
      lastBotVoiceId,
      lastUserMessageId: messageId,
    }),
    saveUserMetrics({
      userId,
      platform: "telegram",
      messageType: "resumeChat",
      userMessage: lastMessage,
      botReplay: botResponse.replay,
    }),
  ]);
};

(async () => {
  if (process.env.BOT_METHOD === "webhook") {
    console.log("start webhook");

    if (config.env === "local") {
      const tunnel = await localtunnel({ port: config.port });
      await bot.telegram.setWebhook(`${tunnel.url}${secretPath}`);

      tunnel.on("close", () => {
        process.exit(0);
      });
    } else {
      await bot.telegram.setWebhook(`${config.bot.baseUrl}${secretPath}`);
      console.log(`bot start litenging on ${config.bot.baseUrl}${secretPath}`);
    }
  } else {
    console.log("start pooling");
    await bot.launch();
  }
})();

export { bot, secretPath, resumeChat };
