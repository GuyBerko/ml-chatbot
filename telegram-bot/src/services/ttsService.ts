import textToSpeech from "@google-cloud/text-to-speech";

const ttsClient = new textToSpeech.TextToSpeechClient();

export const getAudioFromText = async (text: string): Promise<Buffer> => {
  const ttsrequest = {
    input: {
      text,
    },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: "en-US",
      ssmlGender: "MALE",
      name: "en-US-Wavenet-D",
    },
    // select the type of audio encoding
    audioConfig: {
      audioEncoding: "MP3",
      pitch: 0,
      speakingRate: 1,
    },
  };

  //@ts-ignore
  const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsrequest);

  return Buffer.from(ttsResponse.audioContent);
};

export default {
    getAudioFromText
}
