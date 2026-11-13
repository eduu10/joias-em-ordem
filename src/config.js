// Todos os numeros de balanceamento e de ritmo do jogo ficam aqui.
export const CONFIG = Object.freeze({
  capacity: 4,
  emptyJars: 2,
  maxColors: 9,
  levelsPerNewColor: 3,
  solverNodeLimit: 40000,
  generationAttempts: 40,
  undoLimit: 300,
  startingHints: 3,
  hintsPerAd: 3,
  interstitialEveryLevels: 3,
  firstInterstitialLevel: 3,
  flightSeconds: 0.26,
  liftSeconds: 0.14,
  bounceSeconds: 0.24,
  hintSeconds: 2.6,
  toastSeconds: 2.2,
  introSeconds: 0.45,
  winDelaySeconds: 0.7,
  maxFrameSeconds: 0.05,
  saveVersion: 2,
});

export const PHASE = Object.freeze({ PLAYING: 'playing', WON: 'won' });

// Matiz, saturacao e luminosidade de cada cor de gema.
export const PALETTE = Object.freeze([
  Object.freeze([350, 88, 58]),
  Object.freeze([212, 92, 58]),
  Object.freeze([46, 96, 54]),
  Object.freeze([142, 68, 48]),
  Object.freeze([274, 78, 62]),
  Object.freeze([24, 94, 56]),
  Object.freeze([178, 78, 46]),
  Object.freeze([322, 86, 68]),
  Object.freeze([210, 22, 82]),
]);

export const REWARD_ID_HINTS = 'hints-pack-3';
