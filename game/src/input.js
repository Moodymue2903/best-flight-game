// input.js — keyboard + mouse-drag state, one object the flight model reads.
// Arrow keys / WASD pitch and roll, Shift throttle up, Ctrl (or S/W) throttle
// down, C camera, M mute, R restart, Space brake on the ground, 1/2/3 missions.
export function createInput() {
  const keys = new Set();
  const state = {
    keys,
    pitch: 0,        // -1..1, positive = pull up
    roll: 0,         // -1..1, positive = roll right
    throttleUp: false,
    throttleDown: false,
    brake: false,
    dragX: 0,        // mouse look offset, decays back to 0
    dragY: 0,
    pressed: new Set(), // keys pressed since last consume (edge triggers)
  };

  function onKeyDown(e) {
    if (e.repeat) return;
    keys.add(e.code);
    state.pressed.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    keys.delete(e.code);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  window.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    state.dragX += (e.clientX - lastX) * 0.004;
    state.dragY += (e.clientY - lastY) * 0.004;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  state.update = function update(dt) {
    const k = keys;
    const up = k.has('ArrowUp') || k.has('KeyW');
    const down = k.has('ArrowDown') || k.has('KeyS');
    const left = k.has('ArrowLeft') || k.has('KeyA');
    const right = k.has('ArrowRight') || k.has('KeyD');
    state.pitch = (up ? 1 : 0) - (down ? 1 : 0);
    state.roll = (right ? 1 : 0) - (left ? 1 : 0);
    state.throttleUp = k.has('ShiftLeft') || k.has('ShiftRight');
    state.throttleDown = k.has('ControlLeft') || k.has('ControlRight');
    state.brake = k.has('Space');
    // Mouse look drifts back to centre when released.
    state.dragX *= Math.pow(0.02, dt);
    state.dragY *= Math.pow(0.02, dt);
    if (Math.abs(state.dragX) < 0.001) state.dragX = 0;
    if (Math.abs(state.dragY) < 0.001) state.dragY = 0;
  };

  // Edge-triggered key: true once per press.
  state.consume = function consume(code) {
    if (state.pressed.has(code)) {
      state.pressed.delete(code);
      return true;
    }
    return false;
  };
  state.clearPressed = function clearPressed() {
    state.pressed.clear();
  };
  return state;
}
