// config.js — every tuning number for PAPERWING in one place.
// Speeds are in metres per second internally; the HUD shows knots.
export const CONFIG = {
  // Flight model
  maxSpeed: 62,          // m/s at full throttle (~120 kt)
  cruiseSpeed: 34,
  minFlySpeed: 16,       // below this the wing stops lifting: gentle stall
  accel: 14,             // throttle response, m/s^2
  drag: 0.55,            // drag coefficient shaping top speed
  pitchRate: 0.85,       // rad/s at full stick
  rollRate: 2.1,         // rad/s at full stick
  turnFromBank: 0.55,    // heading change per second per radian of bank
  maxPitch: 0.55,
  maxRoll: 1.15,
  gravity: 9.8,

  // World
  worldSize: 2400,       // ground plane spans -1200..1200
  groundY: 0,
  startAltitude: 90,

  // Missions
  fuelMax: 100,
  fuelDrain: 1.6,        // per second at cruise; faster at full throttle
  fuelGateBonus: 34,     // fuel refilled by flying a gate
  balloonsMax: 3,        // lives: pop one per crash or missed gate
  gateRadius: 16,
  gateCount: 8,
  balloonCount: 10,

  // Scoring
  pointsGate: 100,
  pointsBalloon: 150,
  pointsSpeedBonus: 2,   // per knot over 60 kt while passing a gate
  pointsLanding: 500,
  timeBonusPerSecond: 10,

  // Colours — one bright toy palette shared by world and aircraft
  sky: 0x7ec8f7,
  skyHorizon: 0xbfe8ff,
  sun: 0xfff2b0,
  grassA: 0x7ed957,
  grassB: 0x5ec455,
  fieldColours: [0x8fd14f, 0xf2c14e, 0x7ec850, 0xe8a34c, 0x6abe30, 0xffd94d],
  river: 0x3aa7e8,
  roof: 0xe84b3f,
  wall: 0xfff3d6,
  runway: 0x3d4450,
  runwayStripe: 0xffffff,
  gateRed: 0xff4d4d,
  gateWhite: 0xffffff,
  planeRed: 0xff4b3e,
  planeCream: 0xfff1c9,
  planeYellow: 0xffc93c,
};

export const MISSIONS = {
  slalom: {
    id: 'slalom',
    name: 'GATE SLALOM',
    tagline: 'Thread all 8 candy gates. Fast is more points — but gates get harder to hit.',
    goal: 'Fly through every gate in order',
  },
  balloons: {
    id: 'balloons',
    name: 'BALLOON POP',
    tagline: 'Pop 10 balloons in order. Fuel refills ONLY at gates — plan your route.',
    goal: 'Pop all 10 balloons before the fuel runs dry',
  },
  landing: {
    id: 'landing',
    name: 'AIRFIELD LANDING',
    tagline: 'Follow the gates home and kiss the striped runway. Gentle wins.',
    goal: 'Land on the runway, slow and on the centreline',
  },
};
