import { Clock } from "three";

import { preloader } from "./loader";
import resolvers from "./loader/resolvers";
import { defaultAvatar } from "./config";
import { speech } from "./speech";

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
      let visemes = audio.visemeData;
      console.log(visemes);
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

  createResizeHandler({ renderer, camera });

  preloader.init(...resolvers);
  await preloader.load([defaultAvatar]);

  const avatar = Avatar.createDefault(renderer);
  scene.withAvatar(avatar);

  // await speech.init(key, region);
  // const audio = speech.generateAudio("Hello world", "en-US-DavisNeural");
  // let visemes = audio.visemeData;
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
