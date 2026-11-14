// Numeros do jogo. Tudo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const SCREEN = Object.freeze({ HOME: 'home', GAME: 'game' });
export const MODE = Object.freeze({ RUN: 'run', DAILY: 'daily' });
export const PHASE = Object.freeze({ LISTEN: 'listen', ASK: 'ask', REVEAL: 'reveal', OVER: 'over' });

export const CONFIG = Object.freeze({
  lives: 3,
  maxPoints: 100,
  minPoints: 10,
  streakStep: 0.25,
  streakMaxSteps: 4,
  answerSeconds: 9,
  answerSecondsPerLevel: 1,
  answerSecondsMin: 4,
  roundsPerLevel: 3,
  // Quantas cantigas cada nivel libera (nivel 1 = primeira posicao).
  poolByLevel: Object.freeze([5, 7, 9, 11, 13, 15]),
  introSeconds: 0.9,
  revealRightSeconds: 2.4,
  revealWrongSeconds: 2.6,
  dailyRounds: 5,
  options: 4,
  interstitialEveryRuns: 2,
  maxFrameSeconds: 0.05,
  saveVersion: 1,
  tapGraceSeconds: 0.8,
});

export const REWARD_ID_REVIVE = 'cantiga-revive';
