import { User } from "../types/users.types";
import {
  WebSpellCheckerResult,
  CheckSpellingResult,
} from "../types/webSpellChecker.types";
import axios from "axios";
import config from "./config";

const strikeThroughUnicode = unescape("%u0336");

export const getUser = async (userId: number): Promise<User | undefined> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${userId}`;
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    const status = err?.status || err?.response?.status;

    if (status === 404) return;
    console.error(`[getUser] - Error: ${err}`);
  }
};

export const createUser = async (user: User): Promise<User | undefined> => {
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
  lang = 'en_AI',
  onlyGrammar = false,
  noStyle = false
): Promise<CheckSpellingResult | void> => {
  try {
    let foundSpellingError = false;
    const cleanText = encodeURIComponent(text).replace("%0A", "%20");
    const res = await axios.get(
      `${config.webSpellChecker.baseUrl}?cmd=check&format=json&text=${cleanText}&lang=${lang}&customerid=${config.webSpellChecker.token}`
    );

    const data = res.data as WebSpellCheckerResult;
    let matches =
      //@ts-ignore
      data?.result?.[0]?.matches?.sort((a, b) => a.offset - b.offset) || [];

    if (onlyGrammar)
      //@ts-ignore
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
        .toLocaleLowerCase()
        .replaceAll(/[^\w\s]/gi, "");
      const suggestion = match.suggestions[0]
        .toLocaleLowerCase()
        .replaceAll(/[^\w\s]/gi, "");

      if (noStyle && userText === suggestion) continue;

      // always ignore missing period mistake in the end of a sentence
      let endOfSentence = rightHtml === inputTextHtml.length;
      if (endOfSentence) {
        const userTextNoPeriod = inputTextHtml
          .substring(leftHtml, rightHtml)
          .replaceAll(".", "");
        const suggestion = match.suggestions[0].replaceAll(".", "");

        if (userTextNoPeriod === suggestion) continue;
      }

      const strikeThroughText = getStrikeThrough(
        inputTextHtml.substring(leftHtml, rightHtml)
      );
      const boldText = match.suggestions[0].replace(/[A-Za-z]/g, toBold);

      // calculate the added length to the text (plus one for space)
      const addedLength =
        strikeThroughText.length -
        inputTextHtml.substring(leftHtml, rightHtml).length +
        (boldText.length - match.suggestions[0].length) +
        2;

      inputTextHtml = `${inputTextHtml.substring(
        0,
        leftHtml
      )} ${strikeThroughText} ${boldText}${inputTextHtml.substring(
        rightHtml,
        inputTextHtml.length
      )}`;

      foundSpellingError = true;
      deltaOffsetHtml += match.suggestions[0].length + addedLength;
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

const toBold = (char: string): string => {
  let diff;
  if (/[A-Z]/.test(char)) {
    diff = ("𝗔".codePointAt(0) || 0) - ("A".codePointAt(0) || 0);
  } else {
    diff = ("𝗮".codePointAt(0) || 0) - ("a".codePointAt(0) || 0);
  }
  return String.fromCodePoint((char.codePointAt(0) || 0) + diff);
};

const getStrikeThrough = (str: string): string =>
  str.split("").join(strikeThroughUnicode) + strikeThroughUnicode;

export const saveUserData = async (data: {
  userId: number;
  lastBotTextId: number | undefined;
  lastBotVoiceId: number | undefined;
  lastUserMessageId: number;
  totalInteractions: number;
  lastUserMessageDate: Date;
}): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${data.userId}`;

    await axios.put(url, data);
  } catch (err) {
    console.error(`[saveUserData] - Error: ${err}`);
  }
};

export const updateUserOnBoard = async (userId: number): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${userId}`;

    await axios.put(url, { recivedOnBoard: true });
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

export const cancelSubscription = async (data: { userId: number }): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/cancel-subscription`;
    await axios.post(url, data);
  } catch (err) {
    console.error(`[cancelSubscription] - Error: ${err}`);
    throw err;
  }
};

export const saveUserLang = async (data: {
  userId: number;
  lang: string | undefined;
}): Promise<void> => {
  try {
    const url = `${config.usersService.baseUrl}/user/${data.userId}`;

    await axios.put(url, data);
  } catch (err) {
    console.error(`[saveUserLang] - Error: ${err}`);
  }
};

export const messageSentEvent = async (data: {
  data: { userId: number, date: Date },
  type: string
}): Promise<void> => {
  try {
    const url = `${config.schedulerService.baseUrl}/events`; // FIXME: this should be replaced with eventBus later on

    await axios.post(url, data);
    console.log(`[messageSentEvent] Sent event. userId: ${data.data.userId}`);

  } catch (err) {
    console.error(`[messageSentEvent] - Error: ${err}`);
  }
}