// shots.js — deterministic staged screenshots for PAPERWING.
// Reads ?shot=<name>&seed=<n> from the URL. Each shot poses the world, the
// plane, the camera and the HUD from the seed alone, renders a few frames,
// then sets window.__shotReady = true so the screenshot runner can capture it.
// cover: chase view diving through a candy gate over the valley, town and
//   airfield ahead, full HUD — the first screenshot, the cover.
// play: cockpit view threading gates with balloons ahead.
// title: the title screen over the toy valley.
// victory: landed on the striped runway, SLALOM COMPLETE banner, confetti.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createShots(context) {
  const { flight, aircraft, missions, hud, renderer, world, document } = context;

  function readParams() {
    const params = new URLSearchParams(window.location.search);
    return { shot: params.get('shot') || '', seed: Number(params.get('seed') || 1) };
  }

  // Confetti: bright paper squares burst above the runway for the victory shot.
  function spawnConfetti(scene) {
    const colours = [0xff4b3e, 0xffc93c, 0x7ed957, 0x4dd0e1, 0xff5d8f];
    const group = new THREE.Group();
    for (let i = 0; i < 90; i++) {
      const piece = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.1),
        new THREE.MeshBasicMaterial({
          color: colours[i % colours.length], side: THREE.DoubleSide,
        }),
      );
      const angle = (i / 90) * Math.PI * 2;
      const r = 4 + (i % 12);
      piece.position.set(
        Math.cos(angle) * r,
        6 + ((i * 7) % 26),
        40 + Math.sin(angle) * r,
      );
      piece.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      group.add(piece);
    }
    scene.add(group);
    return group;
  }

  function poseCover() {
    // Plane just inside gate 3, diving gently, valley + town + airfield ahead.
    const gate = world.gates[2];
    flight.reset(gate.position.x, gate.position.y + 6, gate.position.z + 55, 0);
    flight.state.pitch = -0.12;
    flight.state.roll = 0.18;
    flight.state.speed = 46;
    flight.state.throttle = 0.8;
    missions.state.missionId = 'slalom';
    missions.state.phase = 'flying';
    missions.state.score = 640;
    missions.state.fuel = 82;
    missions.state.balloons = 3;
    missions.state.gateIndex = 2;
    missions.state.timeLeft = 118;
    // Cover framing: pull the chase camera back and up (18 m / 6.5 m instead
    // of the default 13 m / 4.5 m) so the plane shrinks to about three
    // quarters of its old screen size and the gate, valley, town and runway
    // read as well as the plane. Cover only — live play keeps the default.
    renderer.setChase(18, 6.5);
    renderer.snapChase(flight.state);
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('cockpit-frame').style.display = 'none';
    hud.setVisible(true);
    hud.update(missions.hudState());
  }

  function posePlay() {
    // Cockpit view: gates 4 and 5 ahead, balloons floating to the sides.
    const gate = world.gates[3];
    flight.reset(gate.position.x + 8, gate.position.y + 4, gate.position.z + 70, 0);
    flight.state.pitch = -0.05;
    flight.state.roll = -0.1;
    flight.state.speed = 40;
    flight.state.throttle = 0.7;
    // The cockpit camera sits inside the canopy: hide canopy + windscreen,
    // and any balloon floating right in front of the lens, for a clear view.
    // The prop blades are hidden too: frozen mid-spin they read as a plank.
    aircraft.canopy.visible = false;
    aircraft.screen.visible = false;
    for (const blade of aircraft.propBlades) blade.visible = false;
    for (const b of world.popBalloons) {
      if (b.position.distanceTo(flight.state.position) < 45) b.group.visible = false;
    }
    missions.state.missionId = 'slalom';
    missions.state.phase = 'flying';
    missions.state.score = 910;
    missions.state.fuel = 64;
    missions.state.balloons = 2;
    missions.state.gateIndex = 3;
    missions.state.timeLeft = 96;
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('cockpit-frame').style.display = 'block';
    hud.setVisible(true);
    hud.update(missions.hudState());
  }

  function poseTitle() {
    // High orbit over the valley: airfield, town, river and gates all in view.
    flight.reset(-260, 260, 620, 0.6);
    flight.state.speed = 30;
    flight.state.throttle = 0.5;
    missions.state.missionId = 'slalom';
    missions.state.phase = 'title';
    missions.state.score = 0;
    missions.state.fuel = 100;
    missions.state.balloons = 3;
    renderer.snapChase(flight.state);
    document.getElementById('title-screen').style.display = 'flex';
    document.getElementById('cockpit-frame').style.display = 'none';
    hud.setVisible(false);
  }

  function poseVictory() {
    // Parked on the runway centreline, nose north, banner up, confetti falling.
    // Centre rides 3.3 m up so the wheels touch the runway top (see missions.land).
    flight.reset(0, 3.3, 60, 0);
    flight.state.speed = 0;
    flight.state.throttle = 0;
    flight.state.onGround = true;
    missions.state.missionId = 'slalom';
    missions.state.phase = 'complete';
    missions.state.score = 2840;
    missions.state.fuel = 41;
    missions.state.balloons = 3;
    missions.state.gateIndex = 8;
    missions.state.timeLeft = 34;
    missions.state.confetti = true;
    renderer.snapChase(flight.state);
    spawnConfetti(renderer.scene);
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('cockpit-frame').style.display = 'none';
    hud.setVisible(true);
    hud.update(missions.hudState());
    hud.showBanner('SLALOM COMPLETE!', 'Landing 94% — score 2840 — PAPERWING wins the valley!', 60000);
  }

  // Runs one shot pose, renders frames until settled, then signals readiness.
  function runShot(name) {
    const poses = { cover: poseCover, play: posePlay, title: poseTitle, victory: poseVictory };
    const pose = poses[name];
    if (!pose) return false;
    pose();
    return true;
  }

  return { readParams, runShot };
}
