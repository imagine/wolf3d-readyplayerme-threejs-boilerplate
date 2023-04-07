import { AnimationMixer, NumberKeyframeTrack, KeyframeTrack, AnimationClip, LoopRepeat, Object3D, Vector3 } from "three";
import * as THREE from "three";
import { preloader } from "../loader";

import MorphTargetAnimator from "../helpers/MorphTargetAnimator";
import CursorTracker from "../helpers/CursorTracker";
import { AvatarSettings as avatarSettings } from "../config";

export class Avatar extends Object3D {
  constructor(renderer) {
    super();
    this.init(renderer);
  }

  static createDefault(renderer) {
    const {
      isAutoMorphAnimated,
      isAutoAnimated,
      defaultAnimation,
      isTrackCursor,
      morphTargets,
    } = avatarSettings;

    const avatar = new Avatar(renderer)
      .withMorphAnimator()
      .withMorphTargets(morphTargets);

    if (isAutoMorphAnimated) {
      avatar.withAutoMorphAnimation();
    }
    if (isAutoAnimated) {
      avatar.withAutoAnimation(defaultAnimation);
    }
    if (isTrackCursor) {
      avatar.withCursorTracking();
    }

    return avatar;
  }

  init(renderer) {
    this.renderer = renderer;
    this.avatar = preloader.get("avatar");
    this.model = new Proxy(this.avatar.scene, {
      get: function (model, property) {
        return property in model
          ? model[property]
          : model.getObjectByName(property);
      },
    });
    this.headMesh = this.model.Wolf3D_Avatar;
    this.position.set(0, 0, 0);

    this.mixer = new AnimationMixer(this.model);
    this.mixer.timeScale = 0.5;

    this.add(this.model);
  }

  withRenderer(renderer) {
    this.renderer = renderer;
    return this;
  }

  withMorphAnimator() {
    this.morphAnimator = new MorphTargetAnimator({ mesh: this.headMesh });
    return this;
  }

  withMorphTargets(morphTargets = []) {
    if (!Array.isArray(morphTargets)) {
      throw new Error("Morph targets must be given as array!");
    }
    this.morphAnimator.addRange(morphTargets);
    return this;
  }

  withAutoMorphAnimation(delay = { minInterval: 5000, maxInterval: 7000 }) {
    this.morphAnimator.on("complete", () => {
      this.morphAnimator.autoAnimate(delay);
    });

    this.morphAnimator.autoAnimate(delay);

    return this;
  }

  withAutoAnimation(defaultAnimation = "idle_eyes") {
    /**
     * Animations
     * To see available morph targets and animations, upload your avatar to: https://gltf-viewer.donmccurdy.com/
     */
    const animationClip = this._findAnimation(defaultAnimation);
    // this.mixer.clipAction(animationClip).reset().play().setLoop(LoopRepeat);
    return this;
  }

  withCursorTracking() {
    const cursorTracker = new CursorTracker(this.renderer.domElement);
    cursorTracker.addEventListener("deltaToMouse", (deltaToMouse) => {
      const { x, y } = deltaToMouse.data.clampScalar(-0.65, 0.65);
      this.deltaToMouseRotation = new Vector3(-y, x, 0);
    });
    return this;
  }

  rotateHead() {
    if (!this.deltaToMouseRotation) {
      return;
    }

    const { x, y } = this.deltaToMouseRotation;
    this.model.Head.rotation.set(x, y, 0);
  }

  update(delta) {
    this.rotateHead();
    this.mixer.update(delta);
  }

  playMorphAnimation(blendShapeFrames, times) {
    // set up KeyFrameTrack objects
    let tracks = [];
   
    for (let [name, values] of Object.entries(blendShapeFrames)) {
      const id = this.headMesh.morphTargetDictionary[name];

      console.log(name, times, values);

      const track = new NumberKeyframeTrack(`${this.headMesh.name}.morphTargetInfluences[${id}]`, times, values);
      tracks.push(track);
    }

    // put them into an AnimationClip
    const duration = times[times.length-1];
    const clip = new AnimationClip("morphAnimation", duration*.5, tracks);

    // create an AnimationAction
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);

    this.mixer.addEventListener( 'finished', function( e ) { 
      console.log("finished animation", e.action);
    } );

    // play
    action.play();    
  }


  _findAnimation(name) {
    return this.avatar.animations.find((anim) => anim.name === name);
  }
}
