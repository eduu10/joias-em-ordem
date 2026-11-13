// Numeros de balanceamento. O jogo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
// Unidades da simulacao: metros e segundos. A posicao lateral e medida em faixas (0, 1 e 2).
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const PHASE = Object.freeze({ TITLE: 'title', RUN: 'run', OVER: 'over' });
export const KIND = Object.freeze({ LOW: 'low', HIGH: 'high', BLOCK: 'block', DRONE: 'drone' });
export const ITEM = Object.freeze({ COIN: 'coin', MAGNET: 'magnet', SHIELD: 'shield' });
export const ACTION = Object.freeze({ LEFT: 'left', RIGHT: 'right', JUMP: 'jump', SLIDE: 'slide' });

export const LANES = 3;
export const START_LANE = 1;

// Metade da profundidade de cada obstaculo, em metros.
export const HALF_DEPTH = Object.freeze({ low: 0.2, high: 0.2, block: 0.9, drone: 0.3 });

export const CONFIG = Object.freeze({
  // Velocidade: depende so da distancia percorrida, com teto.
  baseSpeed: 13,
  maxSpeed: 27,
  speedPerMeter: 0.005,

  // Movimento do robo.
  laneRate: 8.5,
  jumpHeight: 1.45,
  jumpSeconds: 0.62,
  fastFallSpeed: 14,
  slideSeconds: 0.7,
  bufferSeconds: 0.22,

  // Colisao.
  playerHalfDepth: 0.3,
  laneHitWidth: 0.5,
  lowClearHeight: 0.55,
  standCenter: 0.6,
  slideCenter: 0.3,

  // Moedas e poderes.
  coinScore: 5,
  coinHeight: 0.6,
  coinSpacing: 1.7,
  collectDepth: 0.6,
  collectLane: 0.6,
  collectHeight: 0.95,
  magnetSeconds: 6,
  magnetRange: 11,
  magnetPull: 9,
  shieldInvulnSeconds: 0.8,
  powerEveryMeters: 300,
  powerChance: 0.6,

  // Reviver depois do anuncio.
  reviveInvulnSeconds: 2,
  reviveClearMeters: 36,

  // Geracao da pista.
  firstRowMeters: 42,
  spawnAhead: 130,
  despawnBehind: 7,
  gapSecondsEasy: 1.3,
  gapSecondsHard: 0.86,
  minGapSeconds: 0.8,
  difficultyMeters: 2800,
  easySegments: 3,
  dronePeriod: 1.7,

  milestoneMeters: 500,
  simStepSeconds: 1 / 60,
  maxFrameSeconds: 0.05,
  interstitialEveryRuns: 2,
  saveVersion: 1,
});

export const REWARD_ID_REVIVE = 'revive-courier';
