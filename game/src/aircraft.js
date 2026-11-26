// aircraft.js — builds the Paperwing: a bright red-and-cream paper stunt
// plane with a folding-paper look (flat-shaded geometry, visible fold lines),
// a smiling sun on the fuselage, a spinning prop and a trailing ribbon.
// The plane faces -Z when heading is 0, matching the flight model.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function buildAircraft() {
  const group = new THREE.Group();
  group.name = 'paperwing-plane';

  const red = new THREE.MeshLambertMaterial({ color: CONFIG.planeRed, flatShading: true });
  const cream = new THREE.MeshLambertMaterial({ color: CONFIG.planeCream, flatShading: true });
  const yellow = new THREE.MeshLambertMaterial({ color: CONFIG.planeYellow, flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2d42, flatShading: true });
  const fold = new THREE.MeshBasicMaterial({ color: 0xd63a2e });

  // Fuselage: a long folded-paper dart, cream belly, red spine.
  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(1.5, 9, 4), red);
  fuselage.rotation.x = -Math.PI / 2;
  fuselage.rotation.y = Math.PI / 4;
  fuselage.scale.set(1, 1, 1);
  fuselage.position.z = -0.5;
  group.add(fuselage);

  // Belly stripe along the fuselage fold.
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 7.5), cream);
  belly.position.set(0, -1.05, -0.5);
  group.add(belly);

  // Fold lines: thin dark seams down the fuselage sides, the paper look.
  for (const side of [-1, 1]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 7.5), fold);
    seam.position.set(side * 0.95, 0.55, -0.5);
    seam.rotation.z = side * 0.5;
    group.add(seam);
  }

  // Main wings: two big flat paper triangles, red on top, cream underneath.
  for (const side of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(side * 7.5, -1.6);
    wingShape.lineTo(side * 7.5, -3.2);
    wingShape.lineTo(0, -2.2);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.18, bevelEnabled: false });
    const wing = new THREE.Mesh(wingGeo, red);
    wing.rotation.x = -Math.PI / 2;
    wing.position.y = 0.35;
    group.add(wing);
    // Cream wingtip.
    const tipShape = new THREE.Shape();
    tipShape.moveTo(side * 5.6, -1.9);
    tipShape.lineTo(side * 7.5, -1.6);
    tipShape.lineTo(side * 7.5, -3.2);
    tipShape.lineTo(side * 5.6, -2.9);
    tipShape.closePath();
    const tip = new THREE.Mesh(
      new THREE.ExtrudeGeometry(tipShape, { depth: 0.2, bevelEnabled: false }),
      cream,
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.y = 0.35;
    group.add(tip);
  }

  // Tail: small red V, folded paper style.
  for (const side of [-1, 1]) {
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(side * 3.2, -1.2);
    tailShape.lineTo(side * 3.2, -2.2);
    tailShape.lineTo(0, -1.4);
    tailShape.closePath();
    const tail = new THREE.Mesh(
      new THREE.ExtrudeGeometry(tailShape, { depth: 0.14, bevelEnabled: false }),
      red,
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 0.3, 3.6);
    group.add(tail);
  }
  // Tail fin.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 2.6);
  finShape.lineTo(-1.8, 0);
  finShape.closePath();
  const fin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(finShape, { depth: 0.16, bevelEnabled: false }),
    yellow,
  );
  fin.position.set(0, 0.4, 3.4);
  group.add(fin);

  // Cockpit: a little cream bubble canopy with a dark windscreen.
  // (Hidden in cockpit view: the camera sits inside the canopy.)
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), cream);
  canopy.scale.set(1, 0.75, 1.6);
  canopy.position.set(0, 0.95, -1.6);
  group.add(canopy);
  const screen = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), dark);
  screen.scale.set(1, 0.7, 1);
  screen.position.set(0, 1.05, -2.6);
  group.add(screen);

  // Smiling sun roundel on each side of the fuselage.
  for (const side of [-1, 1]) {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), yellow);
    sun.position.set(side * 1.28, 0.1, -0.8);
    sun.rotation.y = side * Math.PI / 2;
    group.add(sun);
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.09, 6, 12, Math.PI), dark);
    smile.position.set(side * 1.34, 0.05, -0.8);
    smile.rotation.y = side * Math.PI / 2;
    smile.rotation.z = Math.PI;
    group.add(smile);
  }

  // Prop: a yellow hub and two cream blades at the nose, spinning.
  const prop = new THREE.Group();
  prop.position.set(0, 0, -5.2);
  const propBlades = [];
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 8), yellow);
  hub.rotation.x = -Math.PI / 2;
  prop.add(hub);
  for (const angle of [0, Math.PI]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.14), cream);
    blade.rotation.z = angle;
    blade.position.z = 0.3;
    prop.add(blade);
    propBlades.push(blade);
  }
  group.add(prop);

  // Ribbon: a segmented red streamer trailing from the tail, waving in flight.
  const ribbonSegments = [];
  const ribbonMat = new THREE.MeshLambertMaterial({
    color: CONFIG.planeYellow, flatShading: true, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.9 - i * 0.08, 1.6), ribbonMat);
    seg.position.set(0, 0.2, 4.6 + i * 1.5);
    group.add(seg);
    ribbonSegments.push(seg);
  }

  // Landing gear: two little wheels for the runway.
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 6), dark);
    leg.position.set(side * 1.1, -1.2, -1.8);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 10), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 1.1, -1.75, -1.8);
    group.add(leg, wheel);
  }

  // Apply the flight state to the mesh: position, heading, pitch and bank.
  function pose(flightState) {
    group.position.copy(flightState.position);
    group.rotation.set(0, 0, 0);
    group.rotation.order = 'YXZ';
    group.rotation.y = flightState.heading;
    group.rotation.x = -flightState.pitch;
    group.rotation.z = -flightState.roll;
  }

  // Spin the prop and wave the ribbon; speed sets how hard both work.
  function animate(dt, speed, time) {
    prop.rotation.z += dt * (6 + speed * 0.55);
    for (let i = 0; i < ribbonSegments.length; i++) {
      const seg = ribbonSegments[i];
      seg.position.y = 0.2 + Math.sin(time * 6 - i * 0.9) * 0.35 * (0.4 + speed / 60);
      seg.rotation.y = Math.sin(time * 5 - i * 0.8) * 0.4;
    }
  }

  return { group, prop, propBlades, ribbonSegments, canopy, screen, pose, animate };
}
