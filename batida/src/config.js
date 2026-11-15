// Numeros do jogo. A interface usa um espaco fixo de 360 x 640; o mundo fisico usa metros (y para baixo, chao em y = 0).
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const PHASE = Object.freeze({
  TITLE: 'title', GARAGE: 'garage', TRACKS: 'tracks', AIM: 'aim', RUN: 'run', RESULT: 'result', REPLAY: 'replay',
});

export const PHYS = Object.freeze({
  gravity: 9.8,
  stepSeconds: 1 / 60,
  substeps: 4,
  iterations: 6,
  damping: 0.12,
  maxSpeed: 70,
  bodyFriction: 0.7,
  rollFriction: 0.015,
  brakeFriction: 0.9,
  propFriction: 0.5,
  dummyFriction: 0.6,
  yieldStrain: 0.025,
  plasticRate: 0.6,
  minRest: 0.45,
  maxRest: 1.5,
  staticRadius: 0.1,
  dummyRadius: 0.12,
  hitSpeed: 3,
  scrapeSpeed: 6,
  bounds: Object.freeze({ minX: -170, maxX: 470, minY: -150, maxY: 1 }),
});

export const CONFIG = Object.freeze({
  minSpeedKmh: 30,
  maxSpeedKmh: 150,
  driveAccel: 14,
  runupExtra: 14,
  meterHz: 0.55,
  brakeAfter: 2.5,
  ejectDeltaV: 15,
  ejectWindow: 6,
  ejectCarry: 0.9,
  ejectLift: 2.5,
  settleSpeed: 0.6,
  settleSeconds: 0.8,
  maxCrashSeconds: 5,
  noCrashSeconds: 4,
  maxRunSeconds: 16,
  replaySeconds: 2,
  replayAfterImpact: 1.3,
  replaySpeed: 0.3,
  partStrain: Object.freeze({ bumper: 0.05, hood: 0.08, door: 0.07, wheel: 0.1 }),
  glassStrain: 0.045,
  score: Object.freeze({
    damage: 60, part: 400, glass: 300, eject: 1000, perMeter: 15, flip: 800, airPerSecond: 300, minAir: 0.3,
  }),
  coinDivisor: 20,
  interstitialEveryCrashes: 3,
  maxFrameSeconds: 0.05,
  saveVersion: 1,
  maxScore: 1e7,
  maxCoins: 1e8,
});

export const REWARD_ID_DOUBLE = 'double-coins';
export const REWARD_ID_TRY = 'free-car-try';

export const kmhToMs = (kmh) => kmh / 3.6;
