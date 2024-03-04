import { User } from "../types/users.types";
import {
  WebSpellCheckerResult,
  CheckSpellingResult,
} from "../types/webSpellChecker.types";
import axios from "axios";
import config from "./config";

export const getUser = async (userId: number): Promise<User | undefined> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${userId}`;
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    console.error(`[getUser] - Error: ${err}`);
  }
};

export const createUser = async (user: User): Promise<User | void> => {
  try {
    const url = `${config.usersService.baseUrl}/user`;

    const { status } = await axios.post(url, user);

    if (status !== 201) {
      throw Error(
        `[createUser] - could not create new user recived status ${status}`
      );
    }

    return user;
  } catch (err) {
    console.error(`[getUser] - Error: ${err}`);
  }
};

export const checkSpelling = async (
  text: string,
  onlyGrammar = false,
  noStyle = false
): Promise<CheckSpellingResult | void> => {
  try {
    let foundSpellingError = false;
    const cleanText = encodeURIComponent(text).replace("%0A", "%20");
    const res = await axios.get(
      `${config.webSpellChecker.baseUrl}?cmd=check&format=json&text=${cleanText}&lang=en_AI&customerid=${config.webSpellChecker.token}`
    );

    const data = res.data as WebSpellCheckerResult;
    let matches =
      data?.result?.[0]?.matches?.sort((a, b) => a.offset - b.offset) || [];

    if (onlyGrammar)
      matches = matches.filter((match) => match.type === "grammar");

    let deltaOffsetHtml = 0;
    let deltaOffset = 0;
    let inputTextHtml = text;

    for (const match of matches) {
      if (!match.suggestions) continue;

      let leftHtml = match.offset + deltaOffsetHtml;
      let rightHtml = leftHtml + match.length;
      let left = match.offset + deltaOffset;
      let right = left + match.length;
      const userText = inputTextHtml
        .substring(leftHtml, rightHtml)
        .toLocaleLowerCase();
      const suggestion = match.suggestions[0]
        .toLocaleLowerCase()
        .replaceAll(/[^\w\s]/gi, "");

      if (noStyle && userText === suggestion) continue;

      inputTextHtml = `${inputTextHtml.substring(
        0,
        leftHtml
      )}<s>${inputTextHtml.substring(leftHtml, rightHtml)}</s> <b>${
        match.suggestions[0]
      }</b>${inputTextHtml.substring(rightHtml, inputTextHtml.length)}`;

      foundSpellingError = true;
      deltaOffsetHtml += match.suggestions[0].length + 15;
      deltaOffset += match.suggestions[0].length - (right - left);
    }

    return {
      inputTextHtml,
      foundSpellingError,
    };
  } catch (err) {
    console.error(`[checkSpelling] - ${err}`);
  }
};

export const saveUserData = async (data: {
  userId: number;
  lastBotTextId: number | undefined;
  lastBotVoiceId: number | undefined;
  lastUserMessageId: number;
}): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${data.userId}`;

    await axios.put(url, data);
  } catch (err) {
    console.error(`[saveUserData] - Error: ${err}`);
  }
};

export const saveUserMetrics = async (data: {
  userId: number;
  platform: string;
  messageType: string;
  userMessage: string;
  botReplay: string;
}): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/analytics/${data.userId}`;

    await axios.post(url, data);
  } catch (err) {
    console.error(`[saveUserData] - Error: ${err}`);
  }
};

export const createPaymentUrl = async (
  userId: number,
  lastMessage: string,
  messageId: number | undefined
): Promise<string | undefined> => {
  try {
    const url = `${config.usersService.baseUrl}/create-payment-request`;
    const redirectUrl = "https://t.me/x_ml_bot";
    const body = {
      userId,
      lastMessage,
      redirectUrl,
      messageId,
      platform: 'telegram'
    };
    const { data } = await axios.post(url, body);
    return data.paymentUrl;
  } catch (err) {
    console.error(`[saveUserData] - Error: ${err}`);
  }
};
