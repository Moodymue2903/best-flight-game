// flight.js — the arcade flight model for PAPERWING.
// A forgiving stunt-plane model: throttle sets target speed, the stick banks
// and pitches, lift comes from speed, and below minimum flying speed the
// wing gently stalls (the nose drops and the plane sinks) instead of falling
// out of the sky. All angles in radians, all speeds in m/s.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createFlight() {
  const state = {
    position: new THREE.Vector3(0, CONFIG.startAltitude, 420),
    heading: 0,          // radians, 0 = facing -Z (towards the airfield)
    pitch: 0,            // radians, positive = nose up
    roll: 0,             // radians, positive = bank right
    speed: CONFIG.cruiseSpeed,
    throttle: 0.55,      // 0..1
    onGround: false,
    stalled: false,
    verticalSpeed: 0,
    groundSpeed: 0,
  };

  function reset(x, y, z, heading) {
    state.position.set(x, y, z);
    state.heading = heading;
    state.pitch = 0;
    state.roll = 0;
    state.speed = CONFIG.cruiseSpeed;
    state.throttle = 0.55;
    state.onGround = false;
    state.stalled = false;
    state.verticalSpeed = 0;
  }

  function update(input, dt) {
    // Throttle: Shift up, Ctrl down, eased toward its target.
    if (input.throttleUp) state.throttle = Math.min(1, state.throttle + dt * 0.7);
    if (input.throttleDown) state.throttle = Math.max(0, state.throttle - dt * 0.7);

    if (state.onGround) {
      // Rolling on the runway: throttle accelerates, Space brakes hard.
      const target = state.throttle * CONFIG.maxSpeed * 0.6;
      state.speed += (target - state.speed) * Math.min(1, dt * 0.8);
      if (input.brake) state.speed = Math.max(0, state.speed - dt * 22);
      // Lift off once fast enough and the pilot pulls up.
      if (state.speed > CONFIG.minFlySpeed + 6 && input.pitch > 0) {
        state.onGround = false;
        state.pitch = 0.12;
      }
      state.pitch = 0;
      state.roll *= Math.pow(0.001, dt);
    } else {
      // Airborne: target speed from throttle, drag caps the top end.
      const target = state.throttle * CONFIG.maxSpeed;
      const dragPull = CONFIG.drag * state.speed * state.speed * 0.012;
      state.speed += ((target - state.speed) * 0.9 - dragPull * 0.12) * dt;
      state.speed = Math.max(4, state.speed);

      // Stick: bank and pitch, eased toward the commanded angles.
      const targetRoll = input.roll * CONFIG.maxRoll;
      const targetPitch = input.pitch * CONFIG.maxPitch;
      state.roll += (targetRoll - state.roll) * Math.min(1, dt * 4);
      state.pitch += (targetPitch - state.pitch) * Math.min(1, dt * 3);

      // A bank turns the heading; a steeper bank turns faster.
      state.heading -= Math.sin(state.roll) * CONFIG.turnFromBank * dt * 2.2;

      // Lift: enough speed and the pitch holds altitude; too slow and the
      // nose drops into a gentle stall with a sink rate.
      const liftFactor = Math.min(1, state.speed / CONFIG.minFlySpeed);
      state.stalled = liftFactor < 0.85;
      const climb = Math.sin(state.pitch) * state.speed * liftFactor;
      const sink = state.stalled ? (1 - liftFactor) * 14 : 0;
      state.verticalSpeed = climb - sink - (1 - liftFactor) * 2;
    }

    // Move along the heading, pitched up or down. The forward vector already
    // carries the climb from pitch; a stall adds a straight sink on top.
    const forward = new THREE.Vector3(
      -Math.sin(state.heading) * Math.cos(state.pitch),
      Math.sin(state.pitch),
      -Math.cos(state.heading) * Math.cos(state.pitch),
    );
    state.position.addScaledVector(forward, state.speed * dt);
    if (!state.onGround && state.stalled) {
      const sink = (1 - Math.min(1, state.speed / CONFIG.minFlySpeed)) * 14;
      state.position.y -= sink * dt;
      state.verticalSpeed = Math.sin(state.pitch) * state.speed - sink;
    } else {
      state.verticalSpeed = Math.sin(state.pitch) * state.speed;
    }
    if (state.position.y < CONFIG.groundY) state.position.y = CONFIG.groundY;
    state.groundSpeed = state.speed * Math.cos(state.pitch);
    return state;
  }

  // Heading in compass degrees (0 = north, 90 = east).
  function headingDegrees() {
    let deg = (-state.heading * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }

  // Knots and feet for the HUD.
  function knots() { return state.speed * 1.94384; }
  function feet() { return state.position.y * 3.28084; }

  return { state, reset, update, headingDegrees, knots, feet };
}
