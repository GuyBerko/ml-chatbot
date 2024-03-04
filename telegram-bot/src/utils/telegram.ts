const MAX_MESSAGE_LENGTH = 4096;

export const getSplitMessage = (message: string): string[] => {
  return (
    message.match(new RegExp(".{1," + MAX_MESSAGE_LENGTH + "}", "g")) || [""]
  );
};
