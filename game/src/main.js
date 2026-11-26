// main.js — PAPERWING game loop and screen states.
// States: title (pick a mission) / playing (flying a sortie) / crashed /
// landed / complete. Wires input, flight, missions, HUD, audio, cameras and
// the staged screenshot poses together, then runs the frame loop.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createFlight } from './flight.js';
import { buildWorld } from './world.js';
import { buildAircraft } from './aircraft.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { createMissions } from './missions.js';
import { createRenderer } from './render.js';
import { createShots } from './shots.js';

const canvas = document.getElementById('game-canvas');
const renderer = createRenderer(canvas);
const scene = renderer.scene;
const world = buildWorld(scene, 1);
const aircraft = buildAircraft();
scene.add(aircraft.group);
const flight = createFlight();
const input = createInput();
const hud = createHud(document);
const audio = createAudio();
const missions = createMissions(world, flight, audio, hud);
const shots = createShots({
  flight, aircraft, missions, hud, renderer, world, document,
});

let cameraMode = 'chase';
let screen = 'title'; // title | playing
let shotMode = null;
let framesRendered = 0;
let confettiGroup = null;

// A bright beam over the next gate so the pilot always knows where to fly.
const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(2.2, 2.2, 160, 8, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xffd94d, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  }),
);
beam.position.y = 80;
beam.visible = false; // only shown while flying, at the next objective
scene.add(beam);

// Confetti burst for landings and completions in live play.
function spawnLiveConfetti() {
  if (confettiGroup) return;
  confettiGroup = new THREE.Group();
  const colours = [0xff4b3e, 0xffc93c, 0x7ed957, 0x4dd0e1, 0xff5d8f];
  for (let i = 0; i < 70; i++) {
    const piece = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.1),
      new THREE.MeshBasicMaterial({ color: colours[i % colours.length], side: THREE.DoubleSide }),
    );
    const angle = (i / 70) * Math.PI * 2;
    const r = 4 + (i % 10);
    piece.position.set(
      flight.state.position.x + Math.cos(angle) * r,
      8 + ((i * 7) % 24),
      flight.state.position.z + Math.sin(angle) * r,
    );
    piece.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    confettiGroup.add(piece);
  }
  scene.add(confettiGroup);
}

function startMission(id) {
  audio.unlock();
  missions.startMission(id);
  screen = 'playing';
  cameraMode = 'chase';
  aircraft.canopy.visible = true;
  aircraft.screen.visible = true;
  for (const blade of aircraft.propBlades) blade.visible = true;
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('cockpit-frame').style.display = 'none';
  document.getElementById('help-line').style.display = 'block';
  hud.setVisible(true);
  renderer.snapChase(flight.state);
  if (confettiGroup) {
    scene.remove(confettiGroup);
    confettiGroup = null;
  }
}

function backToTitle() {
  screen = 'title';
  missions.state.phase = 'title';
  missions.state.missionId = 'slalom';
  flight.reset(-260, 260, 620, 0.6);
  flight.state.speed = 30;
  document.getElementById('title-screen').style.display = 'flex';
  document.getElementById('cockpit-frame').style.display = 'none';
  hud.setVisible(false);
  renderer.snapChase(flight.state);
}

// Title-screen mission cards are clickable as well as keys 1/2/3.
for (const card of document.querySelectorAll('.mission-card')) {
  card.addEventListener('click', () => startMission(card.dataset.mission));
}

let lastTime = performance.now();
let elapsed = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  elapsed += dt;
  input.update(dt);

  if (shotMode) {
    // Staged shot: hold the pose, spin the prop, drift the clouds, render.
    aircraft.pose(flight.state);
    aircraft.animate(dt, flight.state.speed, elapsed);
    for (const cloud of world.clouds) {
      cloud.position.x += cloud.userData.drift * dt;
      if (cloud.position.x > 1150) cloud.position.x = -1150;
    }
    const camMode = shotMode === 'play' ? 'cockpit' : 'chase';
    renderer.render(scene, camMode, flight.state, input, dt);
    if (shotMode === 'play') {
      document.getElementById('cockpit-frame').style.display = 'block';
    }
    framesRendered += 1;
    if (framesRendered === 6) window.__shotReady = true;
    requestAnimationFrame(frame);
    return;
  }

  // Edge-triggered keys.
  if (input.consume('KeyC')) {
    cameraMode = cameraMode === 'chase' ? 'cockpit' : 'chase';
    document.getElementById('cockpit-frame').style.display =
      cameraMode === 'cockpit' && screen === 'playing' ? 'block' : 'none';
    // The cockpit camera sits inside the canopy: hide it (and the windscreen)
    // in cockpit view so they never fill the lens; show them in chase view.
    // The prop blades are hidden too: frozen mid-spin they read as a plank
    // across the windscreen, while the hub still shows the spinning prop.
    const showCanopy = cameraMode === 'chase';
    aircraft.canopy.visible = showCanopy;
    aircraft.screen.visible = showCanopy;
    for (const blade of aircraft.propBlades) blade.visible = showCanopy;
  }
  if (input.consume('KeyM')) {
    const muted = audio.toggleMute();
    document.getElementById('mute-state').textContent = muted ? 'MUTED (M)' : 'SOUND ON (M)';
  }
  if (input.consume('KeyR')) {
    if (screen === 'playing') {
      if (missions.state.phase === 'crashed') missions.respawn();
      else missions.startMission(missions.state.missionId);
    }
  }
  if (input.consume('Escape') && screen === 'playing') backToTitle();

  if (screen === 'title') {
    // Title orbit: the plane circles the valley slowly for the backdrop.
    // If a mission key was pressed, start it and skip the orbit pose for
    // this frame — otherwise the orbit would overwrite the mission's start.
    let started = false;
    if (input.consume('Digit1')) { startMission('slalom'); started = true; }
    if (input.consume('Digit2')) { startMission('balloons'); started = true; }
    if (input.consume('Digit3')) { startMission('landing'); started = true; }
    if (input.consume('Enter')) { startMission('slalom'); started = true; }
    if (started) {
      requestAnimationFrame(frame);
      return;
    }
    flight.state.heading += dt * 0.12;
    flight.state.position.x = -260 + Math.sin(elapsed * 0.05) * 120;
    flight.state.position.z = 620 - elapsed * 0;
    flight.state.position.y = 260;
    aircraft.pose(flight.state);
    aircraft.animate(dt, 30, elapsed);
    renderer.render(scene, 'chase', flight.state, input, dt);
    requestAnimationFrame(frame);
    return;
  }

  // Playing a sortie. A crashed or finished plane stays where it stopped;
  // a flying or landed one keeps moving (landed planes taxi on the runway).
  audio.unlock();
  if (missions.state.phase === 'flying' || missions.state.phase === 'landed') {
    flight.update(input, dt);
  }
  missions.update(dt);
  aircraft.pose(flight.state);
  aircraft.animate(dt, flight.state.speed, elapsed);
  audio.setEngine(flight.state.throttle, flight.state.speed);

  // Clouds drift; the beam marks the next objective.
  for (const cloud of world.clouds) {
    cloud.position.x += cloud.userData.drift * dt;
    if (cloud.position.x > 1150) cloud.position.x = -1150;
  }
  const target = missions.state.missionId === 'balloons'
    ? missions.nextBalloon()
    : missions.nextGate();
  if (target && missions.state.phase === 'flying') {
    beam.visible = true;
    beam.position.set(target.position.x, target.position.y + 60, target.position.z);
    beam.material.opacity = 0.25 + Math.sin(elapsed * 4) * 0.12;
  } else {
    beam.visible = false;
  }
  if (missions.state.confetti && !confettiGroup) spawnLiveConfetti();
  if (confettiGroup) {
    for (const piece of confettiGroup.children) {
      piece.position.y -= dt * 6;
      piece.rotation.x += dt * 2;
      piece.rotation.y += dt * 1.4;
      if (piece.position.y < 1) piece.position.y = 30;
    }
  }

  hud.update(missions.hudState());
  renderer.render(scene, cameraMode, flight.state, input, dt);
  requestAnimationFrame(frame);
}

// Boot: a staged shot poses everything and freezes the sim; otherwise the
// title screen opens over a slow orbit of the valley.
const params = shots.readParams();
if (params.shot) {
  shotMode = params.shot;
  const ok = shots.runShot(params.shot);
  if (!ok) shotMode = null;
  screen = 'playing';
  window.__shotReady = false;
  // Render the first frame immediately so the canvas is never blank.
  aircraft.pose(flight.state);
  renderer.render(scene, params.shot === 'play' ? 'cockpit' : 'chase', flight.state, input, 0.016);
} else {
  backToTitle();
}
requestAnimationFrame(frame);
