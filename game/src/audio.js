// audio.js — procedural WebAudio for PAPERWING. No audio files: a cheerful
// puttering engine (two detuned oscillators through a low-pass filter), a
// gate chime, a balloon pop, a crash thud and a landing fanfare. Created lazily
// on the first user gesture so browsers allow it; silent until then.
export function createAudio() {
  let ctx = null;
  let engineOscA = null;
  let engineOscB = null;
  let engineGain = null;
  let engineFilter = null;
  let muted = false;
  let started = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 420;
      engineOscA = ctx.createOscillator();
      engineOscA.type = 'sawtooth';
      engineOscA.frequency.value = 62;
      engineOscB = ctx.createOscillator();
      engineOscB.type = 'square';
      engineOscB.frequency.value = 93;
      const oscBGain = ctx.createGain();
      oscBGain.gain.value = 0.4;
      engineOscA.connect(engineFilter);
      engineOscB.connect(oscBGain);
      oscBGain.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOscA.start();
      engineOscB.start();
      started = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  // Call from a keydown / click handler: the browser's gesture requirement.
  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume();
  }

  function setEngine(throttle, speed) {
    if (!started || muted || !ctx) return;
    const t = ctx.currentTime;
    engineGain.gain.setTargetAtTime(0.05 + throttle * 0.09, t, 0.1);
    engineOscA.frequency.setTargetAtTime(52 + throttle * 70 + speed * 0.4, t, 0.1);
    engineOscB.frequency.setTargetAtTime(78 + throttle * 105 + speed * 0.6, t, 0.1);
    engineFilter.frequency.setTargetAtTime(320 + throttle * 900, t, 0.1);
  }

  function blip(freq, dur, type, vol, when) {
    if (!started || muted || !ctx) return;
    const t = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function gateChime() {
    blip(659, 0.18, 'sine', 0.25);
    blip(880, 0.22, 'sine', 0.25, 0.09);
    blip(1318, 0.3, 'sine', 0.22, 0.18);
  }

  function balloonPop() {
    if (!started || muted || !ctx) return;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    blip(1200, 0.12, 'triangle', 0.2);
  }

  function crashThud() {
    blip(70, 0.4, 'sine', 0.4);
    blip(45, 0.5, 'triangle', 0.3, 0.05);
  }

  function fanfare() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => blip(f, 0.35, 'triangle', 0.25, i * 0.14));
  }

  function toggleMute() {
    muted = !muted;
    if (engineGain && ctx) engineGain.gain.setTargetAtTime(muted ? 0 : 0.08, ctx.currentTime, 0.05);
    return muted;
  }

  return { unlock, setEngine, gateChime, balloonPop, crashThud, fanfare, toggleMute };
}
