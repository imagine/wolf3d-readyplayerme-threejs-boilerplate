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

  createResizeHandler({ renderer, camera });

  preloader.init(...resolvers);
  await preloader.load([defaultAvatar]);

  const avatar = Avatar.createDefault(renderer);
  scene.withAvatar(avatar);

  await speech.init(key, region);
  const audio = speech.generateAudio("Hello world", "en-US-DavisNeural");
  let visemes = audio.visemeData;
  console.log(visemes);

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
