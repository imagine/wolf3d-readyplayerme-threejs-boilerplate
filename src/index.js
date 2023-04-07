import { Clock } from "three";

import { preloader } from "./loader";
import resolvers from "./loader/resolvers";
import { defaultAvatar } from "./config";
import { speech } from "./speech";
import { Base64 } from "js-base64";

import {
  createDefaultContainer,
  createDefaultRenderer,
  createDefaultScene,
  createDefaultCamera,
} from "./factories";

import { Avatar } from "./objects/Avatar";

const { createResizeHandler } = require("./utils");

async function startApplication() {
  const container = createDefaultContainer();
  const renderer = createDefaultRenderer();
  const scene = createDefaultScene();
  const camera = createDefaultCamera();
  const clock = new Clock();

  container.appendChild(renderer.domElement);
  createResizeHandler({ renderer, camera });

  preloader.init(...resolvers);
  await preloader.load([defaultAvatar]);

  const avatar = Avatar.createDefault(renderer);
  scene.withAvatar(avatar);

  let textField = document.createElement("input");
  container.appendChild(textField);
  let button = document.createElement("button");
  button.innerHTML = "Generate";
  container.appendChild(button);
  button.onclick = async () => {
    console.log("clicked buttton");
    console.log("generating the audio!");
    const key = keyField.value;
    console.log(`this is the key ${key}`);

    console.log(textField.value);
    const region = "eastus";
    if (!speech.checkInitialized()) {
      console.log("Not initialized yet..iitializing..");
      try {
        await speech.init(key, region);
      } catch (e) {
        console.log("failed to init");
        console.log(e);
      }
      console.log("done init");
    }
    console.log("generating audio");
    try {
      const audio = await speech.generateAudio(
        textField.value,
        "en-US-DavisNeural"
      );
      console.log("done generating audio");


      let namedFrames = audio.animations.map((blendShapes) => {
        return {
          browDownLeft: blendShapes[41],
          browDownRight: blendShapes[42],
          browInnerUp: blendShapes[43],
          browOuterUpLeft: blendShapes[44],
          browOuterUpRight: blendShapes[45],
          cheekSquintLeft: blendShapes[47],
          cheekSquintRight: blendShapes[48],
          eyeBlinkLeft: blendShapes[0],
          eyeBlinkRight: blendShapes[7],
          eyeLookDownLeft: blendShapes[1],
          eyeLookDownRight: blendShapes[8],
          eyeLookInLeft: blendShapes[2],
          eyeLookInRight: blendShapes[9],
          eyeLookOutLeft: blendShapes[3],
          eyeLookOutRight: blendShapes[10],
          eyeLookUpLeft: blendShapes[4],
          eyeLookUpRight: blendShapes[11],
          eyeSquintLeft: blendShapes[5],
          eyeSquintRight: blendShapes[12],
          eyeWideLeft: blendShapes[6],
          eyeWideRight: blendShapes[13],
          jawLeft: blendShapes[15],
          jawOpen: blendShapes[17],
          jawRight: blendShapes[16],
          mouthClose: blendShapes[18],
          mouthDimpleLeft: blendShapes[27],
          mouthDimpleRight: blendShapes[28],
          mouthFrownLeft: blendShapes[25],
          mouthFrownRight: blendShapes[26],
          mouthFunnel: blendShapes[19],
          mouthLeft: blendShapes[21],
          mouthLowerDownLeft: blendShapes[37],
          mouthLowerDownRight: blendShapes[38],
          mouthPressLeft: blendShapes[35],
          mouthPressRight: blendShapes[36],
          mouthPucker: blendShapes[20],
          mouthRight: blendShapes[22],
          mouthRollLower: blendShapes[31],
          mouthRollUpper: blendShapes[32],
          mouthShrugLower: blendShapes[33],
          mouthShrugUpper: blendShapes[34],
          mouthSmileLeft: blendShapes[23],
          mouthSmileRight: blendShapes[24],
          mouthStretchLeft: blendShapes[29],
          mouthStretchRight: blendShapes[30],
          mouthUpperUpLeft: blendShapes[39],
          mouthUpperUpRight: blendShapes[40],
          noseSneerLeft: blendShapes[49],
          noseSneerRight: blendShapes[50],
          cheekPuff: blendShapes[46],
          jawForward: blendShapes[14],
          tongueOut: blendShapes[51],
        };
      });

      let blendShapeFrames = {};
      for (let i = 0; i < namedFrames.length; i++) {
        const blendShapes = namedFrames[i];
        for (const [blendShapeName, value] of Object.entries(blendShapes)) {
          if (!blendShapeFrames[blendShapeName]) {
            blendShapeFrames[blendShapeName] = [];
          }
          blendShapeFrames[blendShapeName].push(value);
        }
      }

      let times = [];
      for (let i = 0; i < namedFrames.length; i++) {
        times.push(i/60.0);
      }


      if (!audio?.base64Audio) {
        console.error("No audio data to play");
      }
      const blob = new Blob([Base64.toUint8Array(audio.base64Audio)], {
        type: "audio/wav",
      });

      const url = URL.createObjectURL(blob);

      const audioElement = new Audio();
      if (audioElement) {
        audioElement.src = url;
        audioElement.onplay = () => {
          let duration = audioElement.duration;
        };
        container.appendChild(audioElement);
        audioElement.play();
        avatar.playMorphAnimation(blendShapeFrames, times);
      }
    } catch (e) {
      console.log("failed to generate audio");
      console.log(e);
    }
  };

  let keyContainer = document.createElement("div");
  let instructions = document.createElement("p");
  instructions.innerHTML = "Please enter your Azure Speech Services key:";
  keyContainer.appendChild(instructions);

  let keyField = document.createElement("input");
  keyContainer.appendChild(keyField);
  // keyField.onchange = (e) => {
  //   key = e.target.value;
  // };

  container.appendChild(keyContainer);


  // await speech.init(key, region);
  // const audio = speech.generateAudio("Hello world", "en-US-DavisNeural");
  // let visemes = audio.blendShapes;
  // console.log(visemes);

  function render() {
    window.requestAnimationFrame(render);
    renderer.clear();
    renderer.render(scene.main, camera);

    const delta = clock.getDelta();
    scene.main.traverse((element) => element?.update?.(delta));
  }

  render();
}

window.onload = async function () {
  await startApplication();
};
