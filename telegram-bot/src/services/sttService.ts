import speechToText, { protos } from "@google-cloud/speech";
import { spawn } from "child_process";
import fs from "fs";

const sttClient = new speechToText.SpeechClient();

interface RecogiztionResult {
  alternatives: {
    words: string[];
    transcript: string;
    confidence: number;
  }[];
}

interface AudioInfo{
  sampleRate: number;
  filePath: string;
  encoding: number;
}

export const getTranscription = async (
  content: string,
  filePath: string,
): Promise<{ transcription: string; path: string } | void> => {
  try {
    // Call python script to get the file sample rate
    const python = spawn("python", [
      `${process.cwd()}/scripts/media-info.py`,
      filePath,
    ]);

    python.on("error", function (err) {
      console.error(`[media-info] - Error: ${JSON.stringify(err)}`);
      throw Error("could not get sample rate response");
    });

    python.on("exit", function (reason) {
      if (reason !== 0) {
        console.error(`[media-info] - Exit: ${JSON.stringify(reason)}`);
        throw Error("could not get sample rate response");
      }
    });

    python.on("message", function (reason) {
      console.error(`[media-info] - Message:  ${JSON.stringify(reason)}`);
      throw Error("could not get sample rate response");
    });

    // Collect data from script
    const result: AudioInfo = await new Promise((res, rej) => {
      python.stdout.on("data", function (data) {
        const response = JSON.parse(data.toString());
        console.log(response)
        if (response.error) {
          rej(response);
        }
        res(response);
      });
    });

    const audio = {
      content,
    };

    if (result.encoding) {
      const file = fs.readFileSync(result.filePath);
      audio.content = file.toString("base64");
    }

    const config = {
      encoding:
        result.encoding ||
        protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.OGG_OPUS,
      languageCode: "en-US",
      sampleRateHertz: result.sampleRate,
    };

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: audio,
      config: config,
    };

    // Detects speech in the audio file
    //@ts-ignore
    const [response] = await sttClient.recognize(request);
    
    if(!response || !response.results){
      throw Error('could not get stt response');
    }

    const transcription = response.results
      .map((result) => {
        return result?.alternatives?.[0].transcript || ''
      })
      .join(" ");

    return { transcription, path: result.filePath };
  } catch (err) {
    console.error(`[getTranscription] - Error: ${err}`);
  }
};
