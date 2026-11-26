// hud.js — the DOM instrument panel for PAPERWING.
// Big chunky lit instruments: ALTITUDE (ft), SPEED (kt), HEADING (compass),
// a fuel gauge, balloon lives, throttle %, the mission objective, the score,
// a compass strip and an artificial horizon. All DOM, so it stays crisp at
// any size and reads in screenshots.
export function createHud(document) {
  const el = (id) => document.getElementById(id);

  const hud = {
    alt: el('hud-alt-value'),
    speed: el('hud-speed-value'),
    heading: el('hud-heading-value'),
    fuelFill: el('hud-fuel-fill'),
    fuelText: el('hud-fuel-text'),
    throttleFill: el('hud-throttle-fill'),
    throttleText: el('hud-throttle-text'),
    balloons: el('hud-balloons'),
    score: el('hud-score'),
    objective: el('hud-objective'),
    missionName: el('hud-mission'),
    compass: el('hud-compass'),
    horizon: el('hud-horizon-ball'),
    horizonRoll: el('hud-horizon-roll'),
    banner: el('hud-banner'),
    message: el('hud-message'),
    stall: el('hud-stall'),
    timer: el('hud-timer'),
  };

  let bannerTimer = 0;

  function showBanner(text, sub, ms) {
    hud.banner.textContent = text;
    hud.message.textContent = sub || '';
    hud.banner.classList.add('show');
    hud.message.classList.add('show');
    bannerTimer = ms / 1000;
  }

  function update(state) {
    // state: { altitudeFt, knots, headingDeg, fuel, throttle, balloons,
    //   score, objective, missionName, pitch, roll, timeLeft, stalled }
    hud.alt.textContent = String(Math.max(0, Math.round(state.altitudeFt))).padStart(4, '0');
    hud.speed.textContent = String(Math.round(state.knots)).padStart(3, '0');
    hud.heading.textContent = String(Math.round(state.headingDeg)).padStart(3, '0') + '°';
    hud.fuelFill.style.width = Math.max(0, Math.min(100, state.fuel)) + '%';
    hud.fuelFill.classList.toggle('low', state.fuel < 25);
    hud.fuelText.textContent = 'FUEL ' + Math.round(state.fuel) + '%';
    hud.throttleFill.style.width = Math.round(state.throttle * 100) + '%';
    hud.throttleText.textContent = 'THR ' + Math.round(state.throttle * 100) + '%';
    hud.score.textContent = String(state.score).padStart(5, '0');
    hud.objective.textContent = state.objective;
    hud.missionName.textContent = state.missionName;
    hud.timer.textContent = state.timeLeft != null ? 'TIME ' + Math.ceil(state.timeLeft) + 's' : '';

    // Balloon lives: filled = left, popped = grey.
    let icons = '';
    for (let i = 0; i < 3; i++) {
      icons += '<span class="balloon' + (i < state.balloons ? '' : ' lost') + '">●</span>';
    }
    hud.balloons.innerHTML = icons;

    // Compass strip: a sliding window of headings around the current one.
    const deg = state.headingDeg;
    let ticks = '';
    for (let off = -60; off <= 60; off += 15) {
      const h = ((Math.round((deg + off) / 15) * 15) % 360 + 360) % 360;
      const label = h === 0 ? 'N' : h === 90 ? 'E' : h === 180 ? 'S' : h === 270 ? 'W' : String(h);
      const pos = 50 + off * 0.8;
      ticks += '<span class="tick" style="left:' + pos.toFixed(1) + '%">' + label + '</span>';
    }
    hud.compass.innerHTML = ticks + '<span class="compass-needle">▼</span>';

    // Artificial horizon: the ball slides with pitch and rolls with bank.
    const pitchPx = Math.max(-34, Math.min(34, state.pitch * 60));
    hud.horizon.style.transform = 'translateY(' + pitchPx.toFixed(1) + 'px)';
    hud.horizonRoll.style.transform = 'rotate(' + (-state.roll * 57.3).toFixed(1) + 'deg)';
    hud.stall.classList.toggle('show', !!state.stalled);

    if (bannerTimer > 0) {
      bannerTimer -= 1 / 60;
      if (bannerTimer <= 0) {
        hud.banner.classList.remove('show');
        hud.message.classList.remove('show');
      }
    }
  }

  function setVisible(visible) {
    document.getElementById('hud').style.display = visible ? 'block' : 'none';
  }

  return { update, showBanner, setVisible };
}
