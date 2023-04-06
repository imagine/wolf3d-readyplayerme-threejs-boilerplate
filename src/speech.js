import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
var underscore = require("underscore");
// import * as underscore from "underscore";

const getSsml = (text, voice) => `
<speak
  xmlns="https://www.w3.org/2001/10/synthesis"
  xmlns:mstts="https://www.w3.org/2001/mstts"
  version="1.0"
  xml:lang="en-us"
>
  <voice name="${voice || "en-US-DavisNeural"}">
    <prosody rate="1.0">
      <mstts:viseme type="FacialExpression">
        ${text}
      </mstts:viseme>
    </prosody>
    </voice>
  </speak>`;

let synthesizer;
// let client;

const checkInitialized = () => {
  // if (synthesizer === undefined) throw Error("Azure not initialized");
  return synthesizer !== undefined;
};

/**
 * Initialization function
 */
const init = (key, region) => {
  if (key === undefined) throw Error("SPEECH_KEY not defined");
  if (region === undefined) throw Error("SPEECH_REGION not defined");

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);

  synthesizer = new sdk.SpeechSynthesizer(speechConfig);
};

/**
 * Audio generation function
 * @param text
 */
const generateAudio = async (text, voice) => {
  checkInitialized();

  // const synthesizer = new sdk.SpeechSynthesizer(
  //   SpeechConfig.fromSubscription(
  //     process.env.SPEECH_KEY,
  //     process.env.SPEECH_REGION
  //   )
  // );

  let visemeData = [];
  let wordBreakData = [];

  synthesizer.visemeReceived = function (s, e) {
    if (e.animation) {
      visemeData.push(...JSON.parse(e.animation).BlendShapes);
    }
  };

  return new Promise((resolve, reject) => {
    // Replace '&' with 'and' to avoid SSML errors
    const ssml = getSsml(underscore.escape(text), voice);
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        let audio = "";

        if (!!result.audioData) {
          audio = Buffer.from(result.audioData).toString("base64");
          resolve({
            base64Audio: audio,
            visemeData,
          });
        } else if (!!result.errorDetails) {
          console.log("TTS Error\n", result.errorDetails);
          reject(result.errorDetails);
        } else {
          console.log("TTS Error\n", "No audio data returned");
          reject("No audio data returned");
        }
      },
      (error) => {
        console.log("TTS Error\n", error);
        reject(error);
      }
    );
  });
};

export const speech = {
  init,
  generateAudio,
  checkInitialized,
};
