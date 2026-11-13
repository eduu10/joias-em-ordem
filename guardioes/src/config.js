// Numeros de balanceamento e o mapa. O jogo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const PHASE = Object.freeze({ TITLE: 'title', BUILD: 'build', WAVE: 'wave', OVER: 'over' });

// Caminho dos inimigos, da caverna ate o castelo.
export const PATH = Object.freeze([
  [300, 58], [300, 124], [70, 124], [70, 256], [290, 256], [290, 386], [180, 386], [180, 452],
].map((point) => Object.freeze(point)));

export const BASE = Object.freeze({ x: 180, y: 470 });

// Pedestais onde os guardioes ficam. Os primeiros sao os mais bem posicionados.
export const SLOTS = Object.freeze([
  [190, 190], [130, 190], [250, 190],
  [170, 321], [230, 321], [110, 321],
  [175, 66], [240, 66], [110, 66],
  [108, 412], [252, 446], [100, 482],
].map(([x, y]) => Object.freeze({ x, y })));

export const CONFIG = Object.freeze({
  maxTier: 9,
  baseHp: 10,
  startCoins: 50,
  buyBaseCost: 20,
  buyCostGrowth: 1.13,
  heroDamage: 5,
  heroDamageGrowth: 2.15,
  heroCooldown: 0.8,
  heroRange: 88,
  heroRangePerTier: 5,
  shotSpeed: 340,
  enemyHp: 13,
  enemyHpGrowth: 1.21,
  enemySpeed: 34,
  enemySpeedPerWave: 1.2,
  enemySpeedBonusCap: 24,
  enemyCount: 6,
  enemyCountPerWave: 2,
  enemyCountCap: 36,
  spawnInterval: 0.85,
  spawnIntervalMin: 0.4,
  spawnIntervalPerWave: 0.02,
  rewardBase: 2,
  wavesPerRewardStep: 3,
  bossEvery: 5,
  bossHpFactor: 12,
  bossSpeedFactor: 0.6,
  bossRewardFactor: 10,
  bossLeakDamage: 5,
  waveBonus: 8,
  waveBonusPerWave: 2,
  buildSeconds: 2.5,
  firstBuildSeconds: 4,
  interstitialEveryRuns: 2,
  maxFrameSeconds: 0.05,
  saveVersion: 1,
});

export const REWARD_ID_REVIVE = 'revive-castle';
