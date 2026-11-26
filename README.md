# PAPERWING — a bright little flight game

A cheerful low-poly paper stunt plane over a toy valley. Thread candy-striped
gates, pop balloons, and land gently on the striped runway.

## Missions (pick on the title screen, keys 1/2/3 or click)

1. **Gate Slalom** — fly all 8 candy gates in order against a 150 s clock; each
   gate adds 12 s, fuel and points. Speed bonus for fast gate passes.
2. **Balloon Pop** — pop 10 balloons in order; fuel refills ONLY at gates.
3. **Airfield Landing** — follow the gates home and land on the runway;
   touchdown speed and centreline decide the score.

Three balloons are your lives: a crash or a missed gate pops one. Run out and
the sortie is over.

## Controls

- Arrow keys / WASD — pitch and roll
- Shift — throttle up, Ctrl — throttle down
- C — chase / cockpit camera
- M — mute, R — restart sortie (or respawn after a crash)
- Space — brake on the ground, Esc — back to title
- Mouse drag — look around

## Play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and fly. No network requests; Three.js r160 is vendored
under `game/vendor/`. All sounds are procedural WebAudio.

## Layout

- `game/index.html` — page, import map, HUD DOM, title screen
- `game/src/config.js` — tuning + mission definitions
- `game/src/random.js` — seeded RNG
- `game/src/input.js` — keyboard + mouse
- `game/src/flight.js` — arcade flight model (throttle/lift/drag/stall)
- `game/src/world.js` — valley, town, airfield, clouds, gates, balloons
- `game/src/aircraft.js` — the paper plane, prop, ribbon
- `game/src/hud.js` — DOM instruments (ALT/SPD/HDG, fuel, balloons, horizon)
- `game/src/audio.js` — procedural WebAudio sounds
- `game/src/missions.js` — objectives, scoring, fuel, crash/landing
- `game/src/shots.js` — staged screenshot poses
- `game/src/render.js` — renderer, chase + cockpit cameras, lighting
- `game/src/main.js` — game loop and screen states
