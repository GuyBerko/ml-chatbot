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
    errorCode: "UNKOWN_ERROR",
    errorMessage: "Sorry we had some problems please try again",
  },
};

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
    const url = `${config.chatbot.baseUrl}/message`; // TODO: get this from config
    const { data } = await axios.post(url, body);
    return {
      replay: data,
    };
  } catch (err) {
    const status = err.status || err.response.status || 500;
    console.error(`[getMessage] - ${err}`);
    return errors[status];
  }
};
