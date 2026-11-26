// world.js — builds the toy valley: patchwork fields, a blue river, a little
// red-roof town, the striped airfield, puffy clouds, the candy gate chain and
// the pop balloons. Everything is flat-shaded low-poly Three.js geometry in
// one bright palette, laid out from a seeded RNG so every run matches.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeRng, range, pick } from './random.js';

export function buildWorld(scene, seed) {
  const rng = makeRng(seed);
  const group = new THREE.Group();
  group.name = 'paperwing-valley';
  scene.add(group);

  const flat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

  // --- Ground base -------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize),
    flat(CONFIG.grassA),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // --- Patchwork fields --------------------------------------------------
  // A grid of slightly raised coloured rectangles, like a quilt.
  const fieldGeo = new THREE.BoxGeometry(1, 1.2, 1);
  const fieldMeshes = [];
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      if (Math.abs(gx) < 2 && Math.abs(gz) < 2) continue; // keep the airfield clear
      const w = range(rng, 110, 190);
      const d = range(rng, 110, 190);
      const mesh = new THREE.Mesh(fieldGeo, flat(pick(rng, CONFIG.fieldColours)));
      mesh.scale.set(w, 1, d);
      mesh.position.set(gx * 200 + range(rng, -20, 20), 0.4, gz * 200 + range(rng, -20, 20));
      mesh.rotation.y = (rng() - 0.5) * 0.08;
      group.add(mesh);
      fieldMeshes.push(mesh);
    }
  }

  // --- River -------------------------------------------------------------
  // A winding blue ribbon running north-south through the west of the valley.
  const riverPoints = [];
  for (let z = -1100; z <= 1100; z += 100) {
    riverPoints.push(new THREE.Vector3(-520 + Math.sin(z * 0.0022) * 130, 0.7, z));
  }
  const riverCurve = new THREE.CatmullRomCurve3(riverPoints);
  const river = new THREE.Mesh(
    new THREE.TubeGeometry(riverCurve, 64, 26, 6, false),
    new THREE.MeshLambertMaterial({ color: CONFIG.river, flatShading: true }),
  );
  river.scale.y = 0.12;
  group.add(river);

  // --- Town --------------------------------------------------------------
  // A cluster of chunky houses with red roofs beside the river, east of it.
  const houseGroup = new THREE.Group();
  const wallGeo = new THREE.BoxGeometry(22, 16, 18);
  const roofGeo = new THREE.ConeGeometry(17, 12, 4);
  const doorGeo = new THREE.BoxGeometry(6, 9, 1);
  for (let i = 0; i < 26; i++) {
    const house = new THREE.Group();
    const walls = new THREE.Mesh(wallGeo, flat(CONFIG.wall));
    walls.position.y = 8;
    const roof = new THREE.Mesh(roofGeo, flat(pick(rng, [CONFIG.roof, 0xff7a45, 0xd94f3d])));
    roof.position.y = 22;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(doorGeo, flat(0x7a4a2b));
    door.position.set(0, 4.5, 9.2);
    house.add(walls, roof, door);
    const angle = rng() * Math.PI * 2;
    const radius = range(rng, 60, 210);
    house.position.set(-330 + Math.cos(angle) * radius, 0, 260 + Math.sin(angle) * radius * 0.7);
    house.rotation.y = rng() * Math.PI;
    houseGroup.add(house);
  }
  group.add(houseGroup);

  // --- Trees -------------------------------------------------------------
  // Instanced low-poly trees: cone on a cylinder, scattered on the fields.
  const trunkGeo = new THREE.CylinderGeometry(2, 3, 10, 5);
  const crownGeo = new THREE.ConeGeometry(11, 26, 6);
  const trunkMat = flat(0x8a5a2b);
  const crownMat = flat(0x2fae4e);
  const treeCount = 90;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < treeCount; i++) {
    const x = range(rng, -1050, 1050);
    const z = range(rng, -1050, 1050);
    if (Math.abs(x) < 160 && Math.abs(z) < 320) { i--; continue; }
    if (Math.abs(x + 520) < 90) { i--; continue; } // keep the river clear
    const s = range(rng, 0.8, 1.6);
    dummy.position.set(x, 5 * s, z);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, (10 + 13) * s, z);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  }
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  group.add(trunks, crowns);

  // --- Airfield ----------------------------------------------------------
  // Striped runway along Z at the valley centre, a circus tent, windsock,
  // and a row of runway edge lights.
  const airfield = new THREE.Group();
  const runway = new THREE.Mesh(
    new THREE.BoxGeometry(46, 1, 560),
    flat(CONFIG.runway),
  );
  runway.position.set(0, 0.5, 0);
  airfield.add(runway);
  // Centreline dashes.
  const dashGeo = new THREE.BoxGeometry(4, 0.4, 26);
  const dashMat = flat(CONFIG.runwayStripe);
  for (let z = -250; z <= 250; z += 50) {
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 1.1, z);
    airfield.add(dash);
  }
  // Threshold stripes at both ends.
  for (const zEnd of [-272, 272]) {
    for (let x = -18; x <= 18; x += 9) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 14), dashMat);
      stripe.position.set(x, 1.1, zEnd);
      airfield.add(stripe);
    }
  }
  // Big runway numbers painted as flat boxes: "07" at the south end.
  const numMat = flat(0xffd94d);
  const numParts = [
    [-14, -250, 4, 22], [-6, -250, 4, 22], [-14, -239, 12, 4], [-14, -261, 12, 4],
    [8, -250, 4, 22], [8, -239, 12, 4], [16, -250, 4, 11],
  ];
  for (const [x, z, w, d] of numParts) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), numMat);
    part.position.set(x, 1.1, z);
    airfield.add(part);
  }
  // Circus tent: striped cone on a cylinder, beside the runway.
  const tentBase = new THREE.Mesh(
    new THREE.CylinderGeometry(34, 38, 18, 12),
    flat(0xfff1c9),
  );
  tentBase.position.set(95, 9, -60);
  const tentRoof = new THREE.Mesh(
    new THREE.ConeGeometry(38, 26, 12),
    flat(CONFIG.gateRed),
  );
  tentRoof.position.set(95, 31, -60);
  const tentFlag = new THREE.Mesh(
    new THREE.BoxGeometry(1, 14, 1),
    flat(0x7a4a2b),
  );
  tentFlag.position.set(95, 50, -60);
  const tentPennant = new THREE.Mesh(
    new THREE.ConeGeometry(4, 10, 4),
    flat(CONFIG.planeYellow),
  );
  tentPennant.rotation.z = Math.PI / 2;
  tentPennant.position.set(100, 55, -60);
  airfield.add(tentBase, tentRoof, tentFlag, tentPennant);
  // Windsock on a pole.
  const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 30, 6), flat(0xdddddd));
  sockPole.position.set(-70, 15, 120);
  const sock = new THREE.Mesh(new THREE.ConeGeometry(5, 18, 8), flat(0xff8c42));
  sock.rotation.z = -Math.PI / 2;
  sock.position.set(-60, 28, 120);
  airfield.add(sockPole, sock);
  // Runway edge lights: small glowing amber spheres.
  const lightGeo = new THREE.SphereGeometry(2.2, 8, 6);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffb020 });
  for (let z = -270; z <= 270; z += 45) {
    for (const x of [-26, 26]) {
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, 2, z);
      airfield.add(light);
    }
  }
  group.add(airfield);

  // --- Clouds ------------------------------------------------------------
  // Puffy flat-shaded clouds: clusters of white spheres drifting slowly.
  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p++) {
      const r = range(rng, 12, 26);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), cloudMat);
      puff.position.set(range(rng, -26, 26), range(rng, -4, 6), range(rng, -12, 12));
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    cloud.position.set(range(rng, -1000, 1000), range(rng, 150, 260), range(rng, -1000, 1000));
    cloud.userData.drift = range(rng, 1.5, 4);
    group.add(cloud);
    clouds.push(cloud);
  }

  // --- Sun ----------------------------------------------------------------
  // A big flat smiling sun high in the sky, the valley's mascot.
  const sunGroup = new THREE.Group();
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(60, 24),
    new THREE.MeshBasicMaterial({ color: CONFIG.sun }),
  );
  sunDisc.position.set(-700, 420, -900);
  sunDisc.lookAt(0, 0, 0);
  sunGroup.add(sunDisc);
  group.add(sunGroup);

  // --- Gate chain ---------------------------------------------------------
  // 8 candy-striped rings weaving down the valley towards the airfield.
  const gates = [];
  const gatePath = [
    [0, 95, 420], [-120, 80, 260], [110, 70, 120], [-90, 85, -20],
    [120, 75, -160], [-110, 90, -300], [60, 70, -420], [0, 55, -520],
  ];
  for (let i = 0; i < gatePath.length; i++) {
    const [x, y, z] = gatePath[i];
    const gate = buildGate(i, x, y, z);
    group.add(gate.group);
    gates.push(gate);
  }

  // --- Pop balloons -------------------------------------------------------
  // 10 bright balloons floating along the gate route, each a sphere, a knot
  // and a little basket, numbered by a coloured band.
  const popBalloons = [];
  const balloonColours = [0xff5d8f, 0xffc93c, 0x4dd0e1, 0xab7cf5, 0xff8c42, 0x7ed957];
  for (let i = 0; i < CONFIG.balloonCount; i++) {
    const [gx, gy, gz] = gatePath[i % gatePath.length];
    const bx = gx + range(rng, -55, 55);
    const by = gy + range(rng, -18, 28);
    const bz = gz + range(rng, -40, 40);
    const balloon = buildPopBalloon(i, bx, by, bz, balloonColours[i % balloonColours.length]);
    group.add(balloon.group);
    popBalloons.push(balloon);
  }

  return {
    group, gates, popBalloons, clouds, airfield,
    runwayCentre: new THREE.Vector3(0, 0, 0),
    runwayHeading: 0, // runway runs along Z; landing heading is 0 (north)
  };
}

function buildGate(index, x, y, z) {
  const group = new THREE.Group();
  const radius = CONFIG.gateRadius;
  // Ring made of alternating red/white torus segments: 12 arcs, candy-striped.
  for (let s = 0; s < 12; s++) {
    const arc = (Math.PI * 2) / 12;
    const seg = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 1.6, 8, 6, arc * 0.92),
      new THREE.MeshLambertMaterial({
        color: s % 2 === 0 ? CONFIG.gateRed : CONFIG.gateWhite,
        flatShading: true,
      }),
    );
    seg.rotation.z = s * arc;
    group.add(seg);
  }
  // Two striped posts holding the ring, and a floating number board.
  const postMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  const postMatRed = new THREE.MeshLambertMaterial({ color: CONFIG.gateRed, flatShading: true });
  for (const side of [-1, 1]) {
    for (let p = 0; p < 3; p++) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 4, 2.4),
        p % 2 === 0 ? postMatRed : postMat,
      );
      block.position.set(side * radius, y - radius + 2 + p * 4 - y + 0, 0);
      block.position.y = -radius + 2 + p * 4;
      group.add(block);
    }
  }
  // Gate number on a bright board above the ring.
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(14, 9, 1),
    new THREE.MeshLambertMaterial({ color: 0x2b2d42, flatShading: true }),
  );
  board.position.set(0, radius + 9, 0);
  group.add(board);
  const digit = makeDigitMesh(index + 1);
  digit.position.set(0, radius + 9, 0.8);
  group.add(digit);

  group.position.set(x, y, z);
  return { group, index, position: new THREE.Vector3(x, y, z), radius, passed: false };
}

// A chunky 3D digit built from boxes, readable from the air.
function makeDigitMesh(n) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd94d });
  const g = new THREE.Group();
  const bars = {
    1: [[0, 0, 1.4, 8]],
    2: [[0, 3.4, 4.4, 1.4], [1.6, 1.7, 1.4, 3.4], [0, 0, 4.4, 1.4], [-1.6, -1.7, 1.4, 3.4], [0, -3.4, 4.4, 1.4]],
    3: [[0, 3.4, 4.4, 1.4], [1.6, 0, 1.4, 7], [1.1, 0, 2.2, 1.4], [0, -3.4, 4.4, 1.4]],
    4: [[-1.6, 1.7, 1.4, 3.6], [0, 0, 4.4, 1.4], [1.6, 0, 1.4, 7]],
    5: [[0, 3.4, 4.4, 1.4], [-1.6, 1.7, 1.4, 3.4], [0, 0, 4.4, 1.4], [1.6, -1.7, 1.4, 3.4], [0, -3.4, 4.4, 1.4]],
    6: [[0, 3.4, 4.4, 1.4], [-1.6, 0, 1.4, 7], [0, 0, 4.4, 1.4], [1.6, -1.7, 1.4, 3.4], [0, -3.4, 4.4, 1.4]],
    7: [[0, 3.4, 4.4, 1.4], [1.6, 0, 1.4, 7]],
    8: [[0, 3.4, 4.4, 1.4], [-1.6, 0, 1.4, 7], [1.6, 0, 1.4, 7], [0, 0, 4.4, 1.4], [0, -3.4, 4.4, 1.4]],
    9: [[0, 3.4, 4.4, 1.4], [-1.6, 1.7, 1.4, 3.4], [1.6, 0, 1.4, 7], [0, 0, 4.4, 1.4], [0, -3.4, 4.4, 1.4]],
    10: [[-2.6, 0, 1.4, 8], [2.2, 3.4, 4, 1.4], [0.6, 0, 1.4, 7], [3.8, 0, 1.4, 7], [2.2, -3.4, 4, 1.4]],
  }[n] || [[0, 0, 1.4, 8]];
  for (const [bx, by, w, h] of bars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), mat);
    bar.position.set(bx, by, 0);
    g.add(bar);
  }
  return g;
}

function buildPopBalloon(index, x, y, z, colour) {
  const group = new THREE.Group();
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(7, 12, 10),
    new THREE.MeshLambertMaterial({ color: colour, flatShading: true }),
  );
  envelope.scale.y = 1.15;
  envelope.position.y = 6;
  const knot = new THREE.Mesh(
    new THREE.ConeGeometry(2, 3, 6),
    new THREE.MeshLambertMaterial({ color: colour, flatShading: true }),
  );
  knot.rotation.x = Math.PI;
  knot.position.y = -2;
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3.4, 4),
    new THREE.MeshLambertMaterial({ color: 0x8a5a2b, flatShading: true }),
  );
  basket.position.y = -6;
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(7.1, 0.7, 6, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = 6;
  group.add(envelope, knot, basket, band);
  group.position.set(x, y, z);
  group.userData.baseY = y;
  group.userData.phase = index * 0.9;
  return { group, index, position: new THREE.Vector3(x, y, z), popped: false };
}
