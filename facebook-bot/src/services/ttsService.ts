import textToSpeech from "@google-cloud/text-to-speech";

const ttsClient = new textToSpeech.TextToSpeechClient();

export const getAudioFromText = async (text: string, languageCode: string): Promise<Buffer> => {
  // remove emojis
  text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
  
  // set voice type based on langauge code
  const name = languageCode === "es-ES" ? "es-ES-Wavenet-B" : "en-US-Wavenet-D";
  
  const ttsrequest = {
    input: {
      text,
    },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode,
      ssmlGender: "MALE",
      name,
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
