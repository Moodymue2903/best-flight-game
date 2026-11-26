// missions.js — objectives, scoring, fuel, balloons (lives) and crash /
// landing detection for PAPERWING's three missions. The mission owns the
// sortie state; main.js owns the screen state around it.
import { CONFIG, MISSIONS } from './config.js';

export function createMissions(world, flight, audio, hud) {
  const state = {
    missionId: 'slalom',
    phase: 'title',        // title | flying | crashed | landed | complete
    score: 0,
    fuel: CONFIG.fuelMax,
    balloons: CONFIG.balloonsMax,
    gateIndex: 0,
    balloonsPopped: 0,
    gatesPassed: 0,
    timeLeft: null,        // slalom countdown once started
    landed: false,
    crashed: false,
    message: '',
    respawnAt: null,
    confetti: false,
  };

  function missionDef() {
    return MISSIONS[state.missionId];
  }

  function startMission(id) {
    state.missionId = id;
    state.phase = 'flying';
    state.score = 0;
    state.fuel = CONFIG.fuelMax;
    state.balloons = CONFIG.balloonsMax;
    state.gateIndex = 0;
    state.balloonsPopped = 0;
    state.gatesPassed = 0;
    state.timeLeft = id === 'slalom' ? 150 : null;
    state.landed = false;
    state.crashed = false;
    state.confetti = false;
    for (const g of world.gates) g.passed = false;
    for (const b of world.popBalloons) {
      b.popped = false;
      b.group.visible = true;
    }
    // Slalom and landing start at the south end, heading north up the valley.
    // Balloon pop starts higher, above the town, balloons all around.
    if (id === 'balloons') {
      flight.reset(-330, 150, 420, Math.PI / 2);
    } else {
      flight.reset(0, CONFIG.startAltitude, 420, 0);
    }
    hud.showBanner(missionDef().name, missionDef().tagline, 3200);
  }

  function nextGate() {
    return world.gates[state.gateIndex] || null;
  }

  function nextBalloon() {
    return world.popBalloons.find((b) => !b.popped) || null;
  }

  function objectiveText() {
    if (state.phase === 'complete') return 'SORTIE COMPLETE — press R to fly again';
    if (state.phase === 'landed') return 'LANDED! Press R for another sortie';
    if (state.phase === 'crashed') return 'CRASHED — balloon lost. Press R to keep flying';
    if (state.missionId === 'slalom') {
      const g = nextGate();
      return g ? 'GATE ' + (g.index + 1) + ' OF 8 — thread the ring!' : 'All gates flown!';
    }
    if (state.missionId === 'balloons') {
      return 'POP ' + (CONFIG.balloonCount - state.balloonsPopped) + ' BALLOONS LEFT — fuel only at gates!';
    }
    const g = nextGate();
    return g ? 'FOLLOW GATE ' + (g.index + 1) + ' HOME — then land on the runway' : 'LAND NOW — slow, on the centreline';
  }

  function addScore(points, reason) {
    state.score += points;
    hud.showBanner('+' + points, reason, 1200);
  }

  function loseBalloon(reason) {
    state.balloons -= 1;
    audio.crashThud();
    hud.showBanner('BALLOON LOST!', reason, 2200);
    if (state.balloons <= 0) {
      state.phase = 'complete';
      hud.showBanner('SORTIE OVER', 'Out of balloons — final score ' + state.score, 4000);
      return false;
    }
    return true;
  }

  function respawn() {
    // Back to the last gate passed (or the start), wings level, cruise speed.
    const gate = state.gateIndex > 0 ? world.gates[state.gateIndex - 1] : null;
    if (gate) {
      flight.reset(gate.position.x, gate.position.y + 10, gate.position.z + 60, 0);
    } else {
      flight.reset(0, CONFIG.startAltitude, 420, 0);
    }
    state.phase = 'flying';
    state.fuel = Math.max(state.fuel, 45);
  }

  function checkGatePass() {
    const gate = nextGate();
    if (!gate || state.phase !== 'flying') return;
    const p = flight.state.position;
    const dx = p.x - gate.position.x;
    const dy = p.y - gate.position.y;
    const dz = p.z - gate.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < gate.radius) {
      gate.passed = true;
      state.gateIndex += 1;
      state.gatesPassed += 1;
      const speedBonus = Math.max(0, Math.round((flight.knots() - 60) * CONFIG.pointsSpeedBonus));
      const points = CONFIG.pointsGate + speedBonus;
      state.score += points;
      state.fuel = Math.min(CONFIG.fuelMax, state.fuel + CONFIG.fuelGateBonus);
      audio.gateChime();
      hud.showBanner('GATE ' + (gate.index + 1) + '!', '+' + points + ' pts — fuel topped up', 1600);
      if (state.missionId === 'slalom') state.timeLeft += 12;
      if (state.missionId === 'landing' && state.gateIndex >= world.gates.length) {
        hud.showBanner('FINAL APPROACH', 'Runway ahead — throttle down, flare gently', 2500);
      }
    } else if (Math.abs(dz) < 6 && dist > gate.radius + 14 && p.z < gate.position.z) {
      // Flew past the gate plane without going through it: a miss.
      state.gateIndex += 1;
      if (!loseBalloon('You missed gate ' + (gate.index + 1) + ' — balloon lost!')) return;
      if (state.phase === 'flying') respawn();
    }
  }

  function checkBalloonPop() {
    if (state.missionId !== 'balloons' || state.phase !== 'flying') return;
    const target = nextBalloon();
    if (!target) return;
    const p = flight.state.position;
    const d = p.distanceTo(target.position);
    if (d < 12) {
      target.popped = true;
      target.group.visible = false;
      state.balloonsPopped += 1;
      state.score += CONFIG.pointsBalloon;
      audio.balloonPop();
      hud.showBanner('POP!', '+' + CONFIG.pointsBalloon + ' pts — ' +
        (CONFIG.balloonCount - state.balloonsPopped) + ' balloons left', 1500);
      if (state.balloonsPopped >= CONFIG.balloonCount) {
        state.phase = 'complete';
        state.confetti = true;
        state.score += 400;
        audio.fanfare();
        hud.showBanner('ALL BALLOONS POPPED!', 'Bonus +400 — final score ' + state.score, 4500);
      }
    }
  }

  function checkCrashAndLanding(dt) {
    if (state.phase !== 'flying') return;
    const f = flight.state;
    const p = f.position;
    // Ground / water contact. The plane's centre rides 3.3 m above the
    // surface when its wheels touch (runway and field tops sit at 1.0 m,
    // wheels hang 2.3 m below the centre), so contact starts at 3.5 m.
    if (p.y <= 3.5) {
      const overRunway = Math.abs(p.x) < 26 && Math.abs(p.z) < 290;
      // A gentle arrival on the runway is a landing, anywhere else a crash.
      const gentle = Math.abs(f.verticalSpeed) < 6 && f.speed < 34 && Math.abs(f.roll) < 0.3;
      if (overRunway && gentle) {
        land();
        return;
      }
      if (f.onGround) return; // already rolling: not a crash
      crash('You hit the ground at ' + Math.round(flight.knots()) + ' kt!');
      return;
    }
    // River splash: the river runs near x = -520, ±40 wide.
    if (Math.abs(p.x + 520) < 40 && p.y < 4) {
      crash('Splash! The Paperwing does not swim.');
    }
  }

  function land() {
    const f = flight.state;
    f.onGround = true;
    f.position.y = 3.3; // wheels (2.3 m below centre) touch the 1.0 m runway top
    f.pitch = 0;
    const centreError = Math.abs(f.position.x);
    const speedKt = flight.knots();
    const quality = Math.max(0, 100 - Math.round(centreError * 2) - Math.max(0, Math.round(speedKt - 40)));
    const points = Math.round(CONFIG.pointsLanding * (quality / 100));
    state.score += points;
    state.landed = true;
    state.phase = 'landed';
    state.confetti = state.missionId === 'landing' || state.missionId === 'slalom';
    audio.fanfare();
    if (state.missionId === 'slalom' && state.gateIndex >= world.gates.length) {
      state.phase = 'complete';
      hud.showBanner('SLALOM COMPLETE!', 'Landing ' + quality + '% — +' + points + ' pts — score ' + state.score, 5000);
    } else if (state.missionId === 'landing') {
      state.phase = 'complete';
      state.score += 300;
      hud.showBanner('PERFECT LANDING!', 'Quality ' + quality + '% — +' + points + ' pts + 300 bonus', 5000);
    } else {
      hud.showBanner('TOUCHDOWN!', 'Landing quality ' + quality + '% — +' + points + ' pts', 3000);
    }
  }

  function crash(reason) {
    state.phase = 'crashed';
    state.crashed = true;
    flight.state.speed = 0;
    if (!loseBalloon(reason)) return;
  }

  function update(dt) {
    if (state.phase === 'flying') {
      // Fuel burns faster at full throttle.
      const burn = CONFIG.fuelDrain * (0.6 + flight.state.throttle) * dt;
      state.fuel -= burn;
      if (state.fuel <= 0) {
        state.fuel = 0;
        crash('Out of fuel! The Paperwing glides like a brick.');
        return;
      }
      if (state.timeLeft != null) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          state.phase = 'complete';
          hud.showBanner('TIME UP!', 'Final score ' + state.score + ' — press R to fly again', 4000);
          return;
        }
      }
      checkGatePass();
      checkBalloonPop();
      checkCrashAndLanding(dt);
      // Slalom ends when the last gate is passed: fly home and land.
      if (state.missionId === 'slalom' && state.gateIndex >= world.gates.length && !state.landed) {
        // Keep flying; landing completes it (see land()).
      }
    }
    // Balloon bobbing.
    for (const b of world.popBalloons) {
      if (b.popped) continue;
      b.group.position.y = b.group.userData.baseY + Math.sin(Date.now() * 0.001 + b.group.userData.phase) * 3;
    }
  }

  function hudState() {
    return {
      altitudeFt: flight.feet(),
      knots: flight.knots(),
      headingDeg: flight.headingDegrees(),
      fuel: state.fuel,
      throttle: flight.state.throttle,
      balloons: Math.max(0, state.balloons),
      score: state.score,
      objective: objectiveText(),
      missionName: 'PAPERWING — ' + missionDef().name,
      pitch: flight.state.pitch,
      roll: flight.state.roll,
      timeLeft: state.timeLeft,
      stalled: flight.state.stalled,
    };
  }

  return {
    state, startMission, respawn, update, hudState, missionDef,
    objectiveText, nextGate, nextBalloon,
  };
}
