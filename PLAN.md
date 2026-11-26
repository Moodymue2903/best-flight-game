# PAPERWING — Plan

## Concept
Bright stylised arcade slalom flight game. A cheerful low-poly paper-and-balsa
stunt plane ("Paperwing", red/cream, smiling-sun motif, folding-paper look,
trailing ribbon) flies over a toy-like patchwork valley: candy-blue sky, puffy
flat clouds, green patchwork fields, a blue river, a little red-roof town, and
a striped circus-tent airfield with a lit runway. Speed vs control is the core
tension: faster is more points, but gates get harder to hit.

## Missions (3, picked on the title screen, keys 1/2/3)
1. **Gate Slalom** — fly a chain of 8 big candy-striped gates; each clean pass
   adds time and points, a miss costs a balloon (3 balloons = sortie over).
2. **Balloon Pop** — pop 10 floating balloons in order; fuel drains and refills
   only at gates.
3. **Airfield Landing** — follow the gate chain home and land gently on the
   striped runway; touchdown speed and centreline decide the score.
Score = gates + balloons + landing quality + speed bonus. Crashes
(ground / water / too-hard landing) pop a balloon and respawn at the last gate.

## File list (game/src/, one clear job each)
- `config.js` — tuning constants (speeds, fuel, gate layout, colours).
- `random.js` — seeded mulberry32 RNG so shots are deterministic.
- `input.js` — keyboard + mouse-drag state.
- `flight.js` — arcade flight model: lift/drag/throttle/pitch/roll, gentle stall.
- `world.js` — patchwork fields, river, town, airfield, clouds, gates, balloons.
- `aircraft.js` — builds the paper plane, ribbon, spinning prop.
- `hud.js` — DOM HUD + instruments (ALT/SPD/HDG, fuel, balloons, throttle,
  compass strip, artificial horizon).
- `audio.js` — procedural WebAudio: engine putter, gate chime, pop, fanfare.
- `missions.js` — objectives, scoring, fuel, balloons/lives, crash/landing.
- `shots.js` — staged screenshot poses (cover/play/title/victory).
- `render.js` — renderer, chase + cockpit cameras, lighting, sky.
- `main.js` — game loop, states (title/playing/crashed/landed/complete).
- `index.html` — import map (`three` -> `./vendor/three.module.min.js`), HUD DOM.
- `vendor/three.module.min.js` — Three.js r160, downloaded from jsDelivr.

## Shot list (shots.json)
- `1-cover.jpg` `?shot=cover&seed=1` — chase view, plane diving through a
  candy gate over the valley, town + airfield ahead, full HUD.
- `2-play.jpg` `?shot=play&seed=1` — cockpit view threading gates, balloons ahead.
- `3-title.jpg` `?shot=title&seed=1` — title screen over the toy valley.
- `4-victory.jpg` `?shot=victory&seed=1` — landed on the runway,
  "SLALOM COMPLETE" banner, confetti.

## Test list
1. `node --check` every JS file.
2. Serve on port 8103, run the parent's shot runner, confirm 4 screenshots
   each <= 256 KiB and zero console/page errors.
3. `MAKEFUN_OUTPUT_DIR=out node main.ts` — dossier.json exists, game/ and
   screenshots/ copied, dossier non-trivial.
4. Read the screenshots back and judge vs criterion 1 (plane in frame,
   recognisable terrain, gate/runway ahead, HUD readable). Re-stage if weak.
