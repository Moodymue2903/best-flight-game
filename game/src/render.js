// render.js — renderer, cameras and lighting for PAPERWING.
// One WebGL renderer (pixel ratio capped at 1.5 for software GL), a bright
// hemisphere + directional sun, fog for depth, and two cameras the pilot
// toggles with C: a chase camera that trails the plane and a cockpit camera
// that sits in the canopy and looks down the nose.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.sky);
  scene.fog = new THREE.Fog(0xa8d8f8, 500, 1900);

  // Bright sky light from above, warm sun from the south-west.
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x7ed957, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2c0, 1.6);
  sun.position.set(-400, 600, 300);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(300, 200, -400);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 4000);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  // Chase camera: trails behind and above the plane, looking ahead past it,
  // eased so it never snaps. Mouse drag adds a look-around offset.
  // Distance/height are adjustable (the cover shot pulls back a little so
  // the plane does not fill the frame); live play always uses the default.
  let chaseDist = 13;
  let chaseHeight = 4.5;
  function setChase(dist, height) {
    chaseDist = dist;
    chaseHeight = height;
  }
  const chaseOffset = new THREE.Vector3();
  const chaseLook = new THREE.Vector3();
  function chaseCamera(flightState, input, dt) {
    const heading = flightState.heading;
    const back = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const target = new THREE.Vector3(
      flightState.position.x + back.x * chaseDist,
      flightState.position.y + chaseHeight,
      flightState.position.z + back.z * chaseDist,
    );
    chaseOffset.lerp(target, Math.min(1, dt * 5));
    camera.position.copy(chaseOffset);
    const look = new THREE.Vector3(
      flightState.position.x - Math.sin(heading) * 40,
      flightState.position.y - Math.sin(flightState.pitch) * 20,
      flightState.position.z - Math.cos(heading) * 40,
    );
    // Mouse drag looks around without moving the plane.
    look.x += input.dragX * 30 * Math.cos(heading);
    look.y += input.dragY * 20;
    chaseLook.lerp(look, Math.min(1, dt * 6));
    camera.up.set(Math.sin(flightState.roll) * 0.25, 1, 0);
    camera.lookAt(chaseLook);
  }

  // Cockpit camera: in the canopy, looking down the nose, banked with the plane.
  // It sits forward and high (2 m ahead of centre, 1.45 m up) so the nose
  // cone's top faces, which pass right under the lens, do not flare into the
  // lower corners of the frame.
  function cockpitCamera(flightState, input) {
    const heading = flightState.heading;
    const pos = flightState.position;
    camera.position.set(
      pos.x - Math.sin(heading) * 2.0,
      pos.y + 1.45,
      pos.z - Math.cos(heading) * 2.0,
    );
    const look = new THREE.Vector3(
      pos.x - Math.sin(heading) * 60,
      pos.y + Math.sin(flightState.pitch) * 40,
      pos.z - Math.cos(heading) * 60,
    );
    look.x += input.dragX * 20;
    look.y += input.dragY * 12;
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.rotateZ(-flightState.roll);
  }

  function render(sceneToRender, mode, flightState, input, dt) {
    if (mode === 'cockpit') cockpitCamera(flightState, input);
    else chaseCamera(flightState, input, dt);
    renderer.render(sceneToRender, camera);
  }

  // Snap the chase camera behind the plane (used when a shot or respawn poses it).
  function snapChase(flightState) {
    const heading = flightState.heading;
    chaseOffset.set(
      flightState.position.x + Math.sin(heading) * chaseDist,
      flightState.position.y + chaseHeight,
      flightState.position.z + Math.cos(heading) * chaseDist,
    );
    chaseLook.set(
      flightState.position.x - Math.sin(heading) * 40,
      flightState.position.y,
      flightState.position.z - Math.cos(heading) * 40,
    );
  }

  return { renderer, scene, camera, render, resize, snapChase, chaseCamera, cockpitCamera, setChase };
}
