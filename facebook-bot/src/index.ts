import { MessengerContext, getClient } from "bottender";
import {
  checkSpelling,
  createUser,
  getUser,
  saveUserData,
  saveUserMetrics,
  updateUserOnBoard,
  cancelSubscription,
  messageSentEvent
} from "./utils/api";
import { checkSpecialText } from "./utils/utils"
import config from "./utils/config";
import { JsonObject } from "type-fest";
import { User } from "./types/users.types";
import { getMessage, getTracker } from "./services/chatbotService";
import { getAudioFromText } from "./services/ttsService";
import axios from "axios";
import fs from "fs";
import { getTranscription } from "./services/sttService";

const client = getClient("messenger");

async function handleAudio(ctx: MessengerContext) {
  const {
    message: { mid: messageId },
    audio,
  } = ctx.event;
  const user = ctx.state.user as unknown as User;

  if (!user) {
    console.error(
      `[handleAudio] - user does not exist. ${JSON.stringify(ctx.event)}`
    );
    return; // TODO: add error
  }

  console.log(
    `got new message voice from ${user.fullName} ${JSON.stringify(ctx.event)}`
  );

  // send event
  messageSentEvent({ data: {userId: user.userId, date: new Date()}, type: 'UserMessageSent' })

  // start recording action
  ctx.sendSenderAction("typing_on");

  // get the voice audio link
  const link = audio.url;
  // download the audio as buffer and covert it to base 64
  const response = await axios.get(link, { responseType: "arraybuffer" });
  const audioContent = Buffer.from(response.data, "binary").toString("base64");

  // if audioContent length is 0 return error
  if (!audioContent.length) {
    console.error(`[onVoice] - audio content length is zero`);
    ctx.sendText(
      "Sorry, I don't understand what you are saying. Please try again."
    );
    ctx.sendSenderAction("typing_off");
    return;
  }

  // Save the file localy
  const folderPath = `${process.cwd()}/voice_messages/`;
  const filePath = `${folderPath}${user.userId}-${messageId}.ogg`;
  // check if output folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
  // write file
  fs.writeFileSync(filePath, Buffer.from(response.data));

  // get the transcription of the audio
  let { slots } = await getTracker(user.userId);  
  let languageCode = slots?.lang === 'es' ? 'es-ES' : 'en-US';

  const { transcription, path } =
    (await getTranscription(audioContent, filePath, languageCode)) || {};

  if (!path) {
    ctx.sendText(
      "Sorry, I don't understand what you are saying. Please try again."
    );
    ctx.sendSenderAction("typing_off");

    return;
  }

  fs.unlink(path, () => {
    console.log("finish deleting voice");
  });

  // if transcription is empty return error
  if (!transcription) {
    console.error(`[onVoice] - couldnot get transcription from audio`);
    ctx.sendText(
      "Sorry, I don't understand what you are saying. If possible, please minimize background noise and try again."
    );
    ctx.sendSenderAction("typing_off");

    return;
  }

  //ctx.sendText(`stt: ${transcription}`);
  ctx.sendSenderAction("typing_on");

  // get the bot response
  const botResponse = await getMessage(transcription, user.userId);

  // check if language changed
  ({ slots } = await getTracker(user.userId));  
  languageCode = slots?.lang === 'es' ? 'es-ES' : 'en-US';

  // if no bot response return error (maybe try again? and what about deleting the message?)
  if (!botResponse) {
    console.error(`[onVoice] - couldnot get bot replay`); // TODO: add error to log
    ctx.sendText("Sorry, I don't understand what you are saying. Please try again.");
    ctx.sendSenderAction("typing_off");
    return;
  }

  if (botResponse.errorCode || !botResponse.replay) {
    console.error(`[onVoice] - Error getting bot response code: ${botResponse.errorCode}`);
    ctx.sendText(botResponse.errorMessage || "");
    ctx.sendSenderAction("typing_off");
    return;
  }

  // get spelling correction if enabled
  if (config.bot.useCorrection) {
    const lang = languageCode === 'es-ES' ? 'es_AI' : 'en_AI'; 
    const textCorrection = await checkSpelling(transcription, lang, true, true);

    if (textCorrection?.foundSpellingError) {
      try {
        ctx.sendText(`Tip: ${textCorrection.inputTextHtml}`);
      } catch (err) {
        const error = `Error reply_html: ${err}. original message: ${transcription}. html message: ${textCorrection.inputTextHtml}`;
        console.error(error);
      }
      ctx.sendSenderAction("typing_on");
    }
  }

  // get array of the split message
  //const replies = getSplitMessage(botResponse.replay);
  const replies = [botResponse.replay];
  let lastBotTextId, lastBotVoiceId;

  for (const reply of replies) {
    // get the bot response in audio
    const audioReplay = await getAudioFromText(reply, languageCode);

    // replay the audio
    const textResPromise = sendTextWithButtons(ctx, reply);

    const voiceResPromise = ctx.sendAudio(audioReplay, {
      // @ts-ignore
      filename: "audio.mp3",
    });

    await Promise.all([textResPromise, voiceResPromise]).then(
      ([textRes, voiceRes]) => {
        lastBotTextId = textRes?.messageId;
        lastBotVoiceId = voiceRes?.messageId;
      }
    );
  }

  ctx.sendSenderAction("typing_off");

  await Promise.all([
    saveUserData({
      userId: user.userId,
      lastBotTextId,
      lastBotVoiceId,
      lastUserMessageId: messageId,
      totalInteractions: user.totalInteractions + 1,
      lastUserMessageDate: new Date(),
    }),
    saveUserMetrics({
      userId: user.userId,
      platform: "facebook",
      messageType: "voice",
      userMessage: transcription,
      botReplay: botResponse.replay,
    }),
  ]);
}

const handleText = async (ctx: MessengerContext) => {
  const {
    message: { mid: messageId, text },
  } = ctx.event;
  const user = ctx.state.user as unknown as User;

  if (!user?.userId) {
    console.error(
      `[handleText] - user does not exist. ${JSON.stringify(ctx.event)}`
    );
    return; // TODO: add error
  }

  console.log(
    `got new message text from ${user.fullName} ${JSON.stringify(ctx.event)}`
  );

  // send event
  messageSentEvent({ data: {userId: user.userId, date: new Date()}, type: 'UserMessageSent' })

  // start recording action
  ctx.sendSenderAction("typing_on");

  // if text is empty
  if (!text) {
    console.error(`[onText] - didnot recived text message`);
    ctx.sendText(
      "Sorry, I don't understand what you are saying. Please try again."
    );
    ctx.sendSenderAction("typing_off");
    return;
  }

  // check for special text (commands)
  const stop = await checkSpecialText(user, text);
  if (stop) { 
    ctx.sendSenderAction("typing_off");
    return; 
  }

  // get the bot response
  const botResponse = await getMessage(text, user.userId);
  const { slots } = await getTracker(user.userId);  
  const languageCode = slots?.lang === 'es' ? 'es-ES' : 'en-US';

  // if no bot response return error (maybe try again? and what about deleting the message?)
  if (!botResponse) {
    console.error(`[onText] - couldnot get bot replay`); // TODO: add error to log
    ctx.sendText(
      "Sorry, I don't understand what you are saying. Please try again."
    );
    ctx.sendSenderAction("typing_off");
    return;
  }

  if (botResponse.errorCode || !botResponse.replay) {
    console.error(
      `[onText] - Error getting bot response code: ${botResponse.errorCode}`
    );
    ctx.sendText(botResponse.errorMessage || "");
    ctx.sendSenderAction("typing_off");
    return;
  }

  // get spelling correction if enabled and text is not a command (starts with '/')
  if (config.bot.useCorrection && !text.startsWith('/')) {
    const lang = languageCode === 'es-ES' ? 'es_AI' : 'en_AI'; 
    const textCorrection = await checkSpelling(text, lang);
    if (textCorrection?.foundSpellingError) {
      try {
        ctx.sendText(`Tip: ${textCorrection.inputTextHtml}`);
      } catch (err) {
        const error = `Error reply_html: ${err}. original message: ${text}. html message: ${textCorrection.inputTextHtml}`;
        console.error(error);
      }
      ctx.sendSenderAction("typing_on");
    }
  }

  // get array of the split message
  // TODO: uncomment this
  //const replies = getSplitMessage(botResponse.replay);
  const replies = [botResponse.replay];
  let lastBotTextId, lastBotVoiceId;

  for (const reply of replies) {
    // get the bot response in audio
    const audioReplay = await getAudioFromText(reply, languageCode);

    // replay the audio
    const textResPromise = sendTextWithButtons(ctx, reply);

    const voiceResPromise = ctx.sendAudio(audioReplay, {
      // @ts-ignore
      filename: "audio.mp3",
    });

    await Promise.all([textResPromise, voiceResPromise]).then(
      ([textRes, voiceRes]) => {
        lastBotTextId = textRes?.messageId;
        lastBotVoiceId = voiceRes?.messageId;
      }
    );
  }

  ctx.sendSenderAction("typing_off");

  await Promise.all([
    saveUserData({
      userId: user.userId,
      lastBotTextId,
      lastBotVoiceId,
      lastUserMessageId: messageId,
      totalInteractions: user.totalInteractions + 1,
      lastUserMessageDate: new Date(),
    }),
    saveUserMetrics({
      userId: user.userId,
      platform: "facebook",
      messageType: "text",
      userMessage: text,
      botReplay: botResponse.replay,
    }),
  ]);
};

const handleUnsupportedType = async (ctx: MessengerContext) => {
  console.error(
    `[handleUnsupportedType] - got unsupported type ${JSON.stringify(
      ctx.event
    )}`
  );
};

const handleCancelSubscription = async (ctx: MessengerContext) => {
    const user = ctx.state.user as unknown as User;

    if (ctx.event.payload === 'keep_subscription') {
      console.log(`[handleCancelSubscription] ${user.fullName} (id: ${user.userId}) is KEEPING his/her subscription`);
      ctx.sendText(config.texts.subscriptionKept);
      return;
    }

    if (ctx.event.payload === 'cancel_subscription') {
      try {
        await cancelSubscription({ userId: user.userId });
        console.log(`[handleCancelSubscription] ${user.fullName} (id: ${user.userId}) CANCELED his/her subscription`);
        ctx.sendText(config.texts.subscriptionCanceled);
      } catch (err) {
        ctx.sendText(config.texts.somethingWentWrong);
      }
    };
};

const handelOnBoard = async (ctx: MessengerContext) => {
  const { firstName, userId } = ctx.state.user as unknown as User;
  ctx.sendSenderAction("typing_on");

  // get bot langauge from ref param
  const dstLang = ctx.event?.referral?.ref
  const lang = dstLang === 'spanish' ? 'es' : 'en';

  if (firstName) { // set name and language
    await getMessage(`/set_data{\"name\": \"${firstName}\", \"lang\": \"${lang}\"}`, userId);
  } else {  // set just language
    await getMessage(`/set_data{\"lang\": \"${lang}\"}`, userId);
  }  

  // get onboard message
  const botResponse = await getMessage('/new_user', userId);
  
  if (!botResponse?.replay) {
    console.error(`[handelOnBoard] - could not get bot reply`);
    ctx.sendText(config.texts.somethingWentWrong);
    ctx.sendSenderAction("typing_off");
    return;
  }

  // get the bot response in audio
  const languageCode = dstLang === 'spanish' ? 'es-ES' : 'en-US';
  const audioReplay = await getAudioFromText(
    botResponse.replay,
    languageCode
  );

  // send text
  const textResPromise = sendTextWithButtons(ctx, botResponse.replay);

  const voiceResPromise = ctx.sendAudio(audioReplay, {
    // @ts-ignore
    filename: "audio.mp3",
  });

  await Promise.all([textResPromise, voiceResPromise]);
  ctx.sendSenderAction("typing_off");

  await updateUserOnBoard(userId);
};

const handleSuggestResponse = async (ctx: MessengerContext) => {
  const { userId } = ctx.state.user as unknown as User;

  ctx.sendSenderAction("typing_on");

  // set suggested_response slot
  await getMessage('/get_suggested_response', userId);

  const { slots } = await getTracker(userId);  
  
  // get suggested_reponse
  const suggested_response = slots?.suggested_response;

  // get language code
  const languageCode = slots?.lang === 'es' ? 'es-ES' : 'en-US';
  
  if (!suggested_response) {
    console.error(`[handleSuggestResponse] - could not get suggested response`);
    ctx.sendText(config.texts.somethingWentWrong);
    ctx.sendSenderAction("typing_off");
    return;
  }

  // get the bot response in audio
  const audioReplay = await getAudioFromText(
    suggested_response,
    languageCode
  );

  // send text
  const textResPromise = ctx.sendText(suggested_response);

  const voiceResPromise = ctx.sendAudio(audioReplay, {
    // @ts-ignore
    filename: "audio.mp3",
  });

  ctx.sendSenderAction("typing_off");

};

const handleMessage = async (
  ctx: MessengerContext
): Promise<(context: MessengerContext) => Promise<void>> => {
  const user = ctx.state.user as unknown as User;
  if (
    (ctx.event.isPayload && ctx.event.payload === "GET_STARTED") ||
    !user?.recivedOnBoard
  ) {
    return handelOnBoard;
  }

  if (ctx.event.isReferral) {
    console.log('[handleMessage]: Got Referral.')
    return handelOnBoard;
  }

  if (ctx.event.isPayload && (ctx.event.payload === "cancel_subscription" || ctx.event.payload === "keep_subscription")) {
    return handleCancelSubscription;
  }

  if (ctx.event.isPayload && (ctx.event.payload === "get_suggested_response")) {
    return handleSuggestResponse;
  }

  if (ctx.event.isText) {
    return handleText;
  }

  if (ctx.event.isAudio) {
    return handleAudio;
  }

  // return not supported error
  return handleUnsupportedType;
};

type HandlerFunc = (
  ctx: MessengerContext
) => Promise<(context: MessengerContext) => Promise<void>>;

const validateUser = async (ctx: MessengerContext, next: HandlerFunc) => {
  if (!ctx.session) {
    console.error(
      `[validateUser] - context does not have session - ${JSON.stringify(
        ctx.event
      )}`
    );
    return;
  }
  const { id } = ctx.session.user;

  let user = await getUser(id);

  if (!user) {
    console.log("could not find user start creating one");
    let userData;
    try {
      userData = await ctx.getUserProfile();
    } catch (err) {
      console.error(`id: ${id}, err: ${err}`);      
    }
    const { firstName, lastName } = userData || {};

    user = await createUser({
      firstName,
      lastName,
      userId: id,
      fullName: `${firstName || ""} ${lastName || ""}`,
      isNew: true,
      isSubscribe: false,
      authorized: true,
      interactionsCount: 0,
      totalInteractions: 0,
      creationPlatform: "facebook",
      recivedOnBoard: false,
    });

    console.log("finish creating new user");
  }

  // if no user found or created return error
  if (!user) {
    ctx.sendText(
      "Error: could not create new user please try again or contact support."
    );
    return;
  }

  if (!user.authorized) {
    ctx.sendText(
      "You are not authorized to use this bot,\nplease contact support to activate your user."
    );
    return;
  }

  const createdAt = user.createdAt || new Date().getTime();

  if (user.totalInteractions % 30 === 2) {
    ctx.sendText(config.texts.whatCanWeDoTip);
  }

  if (
    !user.isSubscribe && user.totalInteractions > config.bot.maxFreeInteractionCount
  ) {
    await ctx.sendButtonTemplate(config.texts.paymentRequest, [
      {
        type: "web_url",
        url: `${config.stripe.monthlyURL}?client_reference_id=${id}`,
        title: "Subscribe Monthly",
      },
      {
        type: "web_url",
        url: `${config.stripe.yearlyURL}?client_reference_id=${id}`,
        title: "Subscribe Yearly",
      },
    ]);
    return;
  }

  ctx.setState({
    user: user as unknown as JsonObject,
  });

  // set persistent menu
  client.setPersistentMenu([
    {
      type: "web_url",
      url: `https://www.lingos.ai/faqs`,
      title: "Frequently asked questions",
    },
    {
      type: "web_url",
      url: `http://www.lingos.ai`,
      title: "Visit our website",
    },
  ]);

  return next(ctx);
};

export const sendPaymentSuccessfulMessage = async ( userId: number ) => {
  const recipient = userId.toString();
  const user = await getUser(userId);
  if (!user) {
    console.error(`[sendPaymentSuccessfulMessage] Error: User ${recipient} does not exist!`);
    return;
  }

  client.sendSenderAction(recipient, "typing_on");

  await client.sendText(recipient, config.texts.paymentSuccess);

  client.sendSenderAction(recipient, "typing_off");

};

export const sendTest = async () => {
  await client.sendText({ id: "117896080904819" }, "test");
};

function sendTextWithButtons(ctx: MessengerContext, text: string) {
  const textResPromise = ctx.sendButtonTemplate(text, [
    {
      type: 'postback',
      title: 'Suggest Response',
      payload: 'get_suggested_response',
    },
  ]);

  return textResPromise;
}

const App = async (ctx: MessengerContext) => {
  /*
  return async (context: MessengerContext) => {
    await context.sendText(`Hello, we are currently offline for maintenance please try again later.`);
  };*/
  return await validateUser(ctx, handleMessage);
};

export default App;
