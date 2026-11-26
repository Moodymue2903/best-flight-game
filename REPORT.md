# PAPERWING — Build Report

## What was built
A complete original 3D flight game (Three.js r160, vendored, zero network
requests) for the make.fun bounty "Make the best flight game". A bright
red-and-cream paper stunt plane with a smiling-sun motif, folding-paper look,
spinning prop and trailing ribbon flies over a toy patchwork valley: candy-blue
sky, puffy clouds, patchwork fields, a blue river, a red-roof town, and a
striped circus-tent airfield with a lit runway.

Repo: `/home/hatch/workspace/makefun/best-flight-game-candidates/paperwing`

## Missions (title screen, keys 1/2/3 or click)
1. **Gate Slalom** — 8 candy-striped gates in order, 150 s clock, +12 s and
   fuel per gate, speed bonus for fast passes.
2. **Balloon Pop** — pop 10 balloons in order; fuel refills ONLY at gates.
3. **Airfield Landing** — follow the gates home and land on the striped
   runway; touchdown speed and centreline decide the score.
Three balloon lives: a crash or a missed gate pops one; out of balloons ends
the sortie. Crashes respawn at the last gate (R). Score = gates + balloons +
landing quality + speed bonus.

## Controls
Arrows/WASD pitch & roll, Shift throttle up, Ctrl throttle down, C chase /
cockpit camera, M mute, R restart/respawn, Space brake on the ground, Esc
title, mouse drag look-around. HUD: ALT (ft), SPEED (kt), HEADING (compass),
compass strip, artificial horizon, FUEL and THROTTLE gauges, balloon lives,
score, mission objective, slalom timer. All sounds are procedural WebAudio
(engine putter, gate chime, pop, crash thud, fanfare).

## Layout (game/src/, one job per file)
`config.js`, `random.js` (seeded), `input.js`, `flight.js` (arcade model:
throttle/lift/drag, gentle stall), `world.js` (valley/town/airfield/gates/
balloons), `aircraft.js` (paper plane, prop, ribbon), `hud.js`, `audio.js`,
`missions.js` (objectives/scoring/fuel/crash/landing), `shots.js` (staged
poses), `render.js` (chase + cockpit cameras, lighting), `main.js` (loop and
screen states). `game/index.html` holds the import map
(`three` → `./vendor/three.module.min.js`) and the HUD/title DOM.
`main.ts` (written in this session) copies `game/` + `screenshots/` to
`/output` and writes `dossier.json` via `vendor/makefun-game.ts`.

## Verification (all in this session)
- `node --check` on all 12 game JS files: pass. (`serve.ts` is TypeScript, so
  the plain-JS check on it is expected noise; the runner executes it fine.)
- Screenshot runner (port 8103, swiftshader): 4/4 shots, **zero console/page
  errors**:
  - `1-cover.jpg` 107,340 bytes — chase view through gate 3, valley/town/
    airfield ahead, full HUD (ALT 0249 FT, SPD 089 KT, HDG 000°, score, fuel,
    balloons, horizon).
  - `2-play.jpg` 108,023 bytes — cockpit view threading gates, balloons ahead.
  - `3-title.jpg` 95,804 bytes — title screen + mission cards over the valley.
  - `4-victory.jpg` 116,067 bytes — landed on the runway, "SLALOM COMPLETE!"
    banner, confetti.
  All ≤ 256 KiB, 1280×720.
- Live smoke test (no `?shot=`): title loads, key `1` starts the slalom at
  295 ft / 65 kt, fuel 99%, HUD live, no errors.
- Hand-in: `MAKEFUN_OUTPUT_DIR=out node main.ts` → `out/dossier.json`
  (653,340 bytes; 13 source files, 79,878 bytes; 1 vendored file, 670,681
  bytes; 16 files, 750,559 bytes total) with `out/game/` and
  `out/screenshots/` copied. `out/` removed afterwards to keep the repo clean.

## Bugs found and fixed during verification
1. `#hud-objective` was missing `position: absolute` — it rendered as a
   full-width strip across the top, overlapping the ALT panel. Fixed; the
   mission label was also moved below the compass strip.
2. The gate-guide beam was visible by default (a yellow pillar at the world
   origin in shots). Now hidden until flying.
3. Clouds were Lambert-shaded and read grey-green; now flat white.
4. The landed plane's wings were buried inside the runway slab (runway top
   at 1.0 m, plane centre at 0). Landing now rests the centre at 3.3 m so
   the wheels touch; crash/land detection triggers at 3.5 m.
5. The cockpit camera sat inside the canopy, so the dark windscreen filled
   the play shot; the frozen prop blade also read as a plank. Canopy,
   windscreen and prop blades are hidden in cockpit view (hub still shows).
6. The title-orbit code ran in the same frame as a mission start and
   overwrote the mission's starting altitude (260 m instead of 90 m). The
   title branch now returns early once a mission starts.

## Honest self-assessment vs the 5 judge criteria
1. **Complete flight game shown** — strong. Cover shows chase view, plane in
   frame, gate ahead, recognisable terrain, lit HUD with ALT/SPD/HDG. Play
   shows a real cockpit view with gates and balloons. Victory shows the
   runway landing.
2. **Fun and depth** — good. Three genuinely different missions, fuel as a
   real constraint (balloon mission), speed-vs-control scoring, lives.
3. **Feel and polish** — good. Throttle/bank/pitch answer at all speeds,
   gentle stall, chase camera eases, cockpit camera hides the canopy, landings
   vs crashes read distinctly (banner + respawn vs touchdown + confetti).
4. **Look and originality** — good. One bright toy palette throughout, an
   original paper-plane design, numbered candy gates, a smiling-sun motif.
   The title-screen plane reads as a dark silhouette from behind (its lit
   side faces away from the camera) — the weakest frame, but it still reads
   as a plane.
5. **Structure** — strong. 13 source files, each named for its one job, plus
   a vendored Three.js listed separately in the dossier.

## Fix round (2026-11-26, visual fixes only — no gameplay change)

Three defects found on review of the screenshots; all three addressed with
small, local edits (files: `game/src/world.js`, `game/src/render.js`,
`game/src/shots.js`).

1. **Gate "3" reading as mirrored — FIXED (legibility, not geometry).**
   Pixel analysis of the old `1-cover.jpg` proved the glyph was actually a
   correct "3" (full-height yellow columns on the RIGHT of the digit =
   spine on the right; a horizontal flip of the crop reads unambiguously as
   "Ɛ"). The cause was the box font, not a flipped texture or plane: all
   three bars reached the same left edge, so at a glance the three aligned
   bar-ends read as a left spine. Fix: the "3"'s middle bar is now
   right-aligned and half-length (`[1.1, 0, 2.2, 1.4]` instead of
   `[0, 0, 4.4, 1.4]`), giving the classic "3" pinch — the left edge is now
   an open notch, so the digit cannot read as "Ɛ". Verified by re-shooting
   the cover and by pixel profile: the middle bar no longer reaches the left
   edge, the spine stays on the right, and the zoomed crop reads as "3".
   No other digit needed the change ("4", "5", "6" are asymmetric and read
   correctly; checked "4" and "5" in the new shots).
2. **Cover plane too large — FIXED.** `render.js` gained a `setChase(dist,
   height)` control (defaults 13 m / 4.5 m, unchanged for live play);
   `poseCover` in `shots.js` pulls the cover chase camera back/up to
   18 m / 6.5 m. The plane shrinks to ~3/4 of its old screen size, stays
   clearly in frame, and the gate, valley, town and runway now read as well
   as the plane.
3. **Cockpit nose flare — FIXED (one-line camera tweak, no remodel).**
   A vertex-projection probe of the play pose showed the cause: the cockpit
   camera sat 1.2 m ahead of centre and 1.1 m up, inside the fuselage cone's
   span (nose apex 5 m ahead), so the cone's top faces passed right under
   the lens and, clipped by the near plane, smeared red into the lower
   corners (the wings/tail/ribbon are all behind the camera and were ruled
   out). Fix: cockpit camera moved forward/up to 2.0 m ahead, 1.45 m up
   (`render.js` `cockpitCamera`). The red flare no longer reaches the
   corners — only small nose wedges remain at the bottom edge, clear of the
   corners. Side effect: the yellow prop hub reads slightly larger
   (it is 0.8 m closer); it still reads as the prop hub, centred, and the
   gate 4 ring is now fully visible and centred.

Re-verified after the fixes: screenshot runner (port 8103, swiftshader),
4/4 shots, **zero console/page errors**, all ≤ 256 KiB:
`1-cover.jpg` 103,506 bytes, `2-play.jpg` 107,511 bytes,
`3-title.jpg` 95,839 bytes, `4-victory.jpg` 116,111 bytes. Title and
victory shots unchanged in composition. Hand-in re-run:
`MAKEFUN_OUTPUT_DIR=out node main.ts` → `out/dossier.json` (648,534
bytes); `out/` removed afterwards. Not pushed, bundled, checked or
submitted — the parent handles packaging.

## Remaining weaknesses
- The cockpit view's prop hub reads as a large dull-gold block dead centre
  (it is the yellow hub, 3.2 m ahead of the cockpit camera, lit from behind);
  it reads as the prop, but it is prominent.
- No in-flight pause; Esc returns to title instead.
- Not pushed, bundled, checked or submitted — the parent handles packaging.
