// Numeros de balanceamento e medidas. O jogo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const PHASE = Object.freeze({ TITLE: 'title', PLAY: 'play', OVER: 'over' });

export const GRID = 8;
export const TRAY_SIZE = 3;

// Tabuleiro: canto de cima a esquerda e tamanho de cada casa.
export const BOARD = Object.freeze({ x: 20, y: 104, cell: 40, size: 320 });

// Bandeja com as tres pecas oferecidas.
export const TRAY = Object.freeze({
  slots: Object.freeze([64, 180, 296]),
  y: 524,
  cell: 22,
  top: 456,
  bottom: 592,
  halfWidth: 57,
});

export const CONFIG = Object.freeze({
  pointsPerCell: 1,
  pointsPerLine: 10,
  clearAllBonus: 50,
  reviveRows: 3,
  reviveCols: 3,
  interstitialEveryRuns: 2,
  maxFrameSeconds: 0.05,
  maxScore: 1000000000,
  saveVersion: 1,
});

// Tempos e distancias das animacoes e do arrasto.
export const FEEL = Object.freeze({
  liftPixels: 46,
  liftSeconds: 0.12,
  returnSeconds: 0.2,
  popSeconds: 0.3,
  dealSeconds: 0.36,
  dealStagger: 0.07,
  clearStagger: 0.035,
  tileSeconds: 0.3,
  overCardDelay: 0.9,
  overInputDelay: 1.4,
  toastSeconds: 2.2,
  shakePixels: 5,
  shakePerLine: 0.4,
  scoreCatchUp: 9,
  maxFx: 460,
});

export const REWARD_ID_REVIVE = 'revive-crystals';
