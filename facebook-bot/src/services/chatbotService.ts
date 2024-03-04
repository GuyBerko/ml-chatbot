import axios from "axios";
import { ChatBotResponse } from "../types/chatbot.types";
import config from "../utils/config";

const errors: { [key: number]: ChatBotResponse } = {
  425: {
    errorCode: "IN_PROGRESS",
    errorMessage:
      "Please wait for my response before sending another message.\nIf you do not get a response after one minute, try again..",
  },
  403: {
    errorCode: "NOT_LAST_MESSAGE_EDIT",
    errorMessage:
      "You can only edit your last message..",
  },
  500: {
    errorCode: "UNKNOWN_ERROR",
    errorMessage: "Sorry we had some problems please try again",
  },
};

const regex = /_([A-Za-z_]*)_/gi;
/*
export const getMessage = async (
  messageText: string,
  fullName: string,
  userId: number,
  messageId: number,
  withEdit: boolean
): Promise<ChatBotResponse> => {
  const body = {
    messageText,
    fullName,
    userId,
    messageId,
    withEdit,
  };
  try {
    console.log(`getting bot response from ${config.chatbot.baseUrl}`)
    const url = `${config.chatbot.baseUrl}/message`; 
    const { data } = await axios.post(url, body);
    const replay = data.replace(regex, '');
    return {
      replay,
    };
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    console.error(`[getMessage] - ${JSON.stringify(err)}`);
    return errors[status];
  }
};*/

export const getMessage = async (
  messageText: string,
  userId: number,
): Promise<ChatBotResponse | void> => {
  const body = {
    message: messageText,
    sender: userId,
  };
  console.log(body);
  try {
    console.log(`getting bot response from ${config.nlu.baseUrl}`)
    const url = `${config.nlu.baseUrl}/webhooks/rest/webhook`;
    const { data } = await axios.post(url, body);

    if (!data) {  // running intents that set slots returns an empty array
      return;
    }
    
    // concat all messages if necessary
    let replay = data[0].text;
    for (let ii = 1; ii < data.length; ii++) { 
        replay = replay + '\n\n' + data[ii].text;
    }
    return {
      replay,
    };
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    console.error(`[getMessage] - ${JSON.stringify(err)}`);
    return errors[status];
  }
};

export const getTracker = async (userId: number): Promise<ChatBotResponse> => {
  try {
    console.log(`getting bot tracker from ${config.nlu.baseUrl}`)
    const url = `${config.nlu.baseUrl}/conversations/${userId}/tracker`;
    const { data } = await axios.get(url);
    const { slots } = data;

    return {
      slots,
    };
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    console.error(`[getMessage] - ${JSON.stringify(err)}`);
    return errors[status];
  }
};