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
          browDown_L: blendShapes[41],
          browDown_R: blendShapes[42],
          browInnerUp: blendShapes[43],
          browOuterUp_L: blendShapes[44],
          browOuterUp_R: blendShapes[45],
          cheekSquint_L: blendShapes[47],
          cheekSquint_R: blendShapes[48],
          eyeBlink_L: blendShapes[0],
          eyeBlink_R: blendShapes[7],
          eyeLookDown_L: blendShapes[1],
          eyeLookDown_R: blendShapes[8],
          eyeLookIn_L: blendShapes[2],
          eyeLookIn_R: blendShapes[9],
          eyeLookOut_L: blendShapes[3],
          eyeLookOut_R: blendShapes[10],
          eyeLookUp_L: blendShapes[4],
          eyeLookUp_R: blendShapes[11],
          eyeSquint_L: blendShapes[5],
          eyeSquint_R: blendShapes[12],
          eyeWide_L: blendShapes[6],
          eyeWide_R: blendShapes[13],
          jawLeft: blendShapes[15],
          jawOpen: blendShapes[17],
          jawRight: blendShapes[16],
          mouthClose: blendShapes[18],
          mouthDimple_L: blendShapes[27],
          mouthDimple_R: blendShapes[28],
          mouthFrown_L: blendShapes[25],
          mouthFrown_R: blendShapes[26],
          mouthFunnel: blendShapes[19],
          mouthLeft: blendShapes[21],
          mouthLowerDown_L: blendShapes[37],
          mouthLowerDown_R: blendShapes[38],
          mouthPress_L: blendShapes[35],
          mouthPress_R: blendShapes[36],
          mouthPucker: blendShapes[20],
          mouthRight: blendShapes[22],
          mouthRollLower: blendShapes[31],
          mouthRollUpper: blendShapes[32],
          mouthShrugLower: blendShapes[33],
          mouthShrugUpper: blendShapes[34],
          mouthSmile_L: blendShapes[23],
          mouthSmile_R: blendShapes[24],
          mouthStretch_L: blendShapes[29],
          mouthStretch_R: blendShapes[30],
          mouthUpperUp_L: blendShapes[39],
          mouthUpperUp_R: blendShapes[40],
          noseSneer_L: blendShapes[49],
          noseSneer_R: blendShapes[50],
          cheekPuff: blendShapes[46],
          jawForward: blendShapes[14],
          tongueOut: blendShapes[51],
        };
      });

      let morphTargets = namedFrames.map((namedFrame) => {
        let morphTarget = [];
        for (const [key, value] of Object.entries(namedFrame)) {
          // AnimationClip.CreateFromMorphTargetSequence takes a MorphTarget[], which contains vertices rather than a targetValue
          // TODO: get that going or animate the morph targets another way
          morphTarget.push({ name: key, vertices: value });
        }
        return morphTarget;
      });

      avatar.playMorphAnimation(morphTargets, 60);

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
          console.log("playing audio");
          // TODO: start animation
        };
        audioElement.play();
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
