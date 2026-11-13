// Numeros de balanceamento. O jogo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const PHASE = Object.freeze({ TITLE: 'title', PLAY: 'play', OVER: 'over' });

// Capsula de vidro: paredes e chao da fisica, linha de perigo e altura de onde o corpo e solto.
export const CAPSULE = Object.freeze({ left: 42, right: 318, floor: 606, top: 66, dangerY: 160, dropY: 118 });

// Corpos celestes, do menor ao maior. `points` e o que vale criar aquele corpo numa fusao.
export const TIERS = Object.freeze([
  { key: 'meteor', radius: 12, points: 0, color: [28, 40, 58] },
  { key: 'moon', radius: 17, points: 2, color: [48, 30, 82] },
  { key: 'rocky', radius: 23, points: 5, color: [14, 80, 62] },
  { key: 'ocean', radius: 29, points: 9, color: [205, 90, 62] },
  { key: 'ringed', radius: 36, points: 14, color: [42, 90, 66] },
  { key: 'gas', radius: 44, points: 20, color: [24, 95, 64] },
  { key: 'ice', radius: 53, points: 27, color: [180, 80, 68] },
  { key: 'redStar', radius: 63, points: 35, color: [8, 100, 64] },
  { key: 'blueStar', radius: 74, points: 44, color: [212, 100, 74] },
  { key: 'galaxy', radius: 86, points: 55, color: [285, 90, 72] },
].map((tier) => Object.freeze({ ...tier, color: Object.freeze(tier.color) })));

export const CONFIG = Object.freeze({
  // Fisica
  gravity: 1500,
  fixedDt: 1 / 120,
  maxSubsteps: 8,
  iterations: 8,
  restitution: 0.22,
  bounceMinSpeed: 90,
  friction: 0.08,
  floorFriction: 0.02,
  linearDamping: 0.4,
  maxSpeed: 1300,
  correction: 0.85,
  slop: 0.02,
  spinGrip: 0.12,
  spinDamping: 1.5,
  maxSpin: 12,
  bumpSpeed: 150,
  growSeconds: 0.18,
  // Regras
  mergeSlop: 2,
  mergeKeepSpeed: 0.4,
  galaxyBonus: 150,
  dropWeights: Object.freeze([35, 30, 20, 10, 5]),
  dropCooldown: 0.45,
  dangerGraceSeconds: 1,
  dangerSeconds: 1.5,
  dangerCoolRate: 2,
  reviveFraction: 1 / 3,
  reviveClearance: 40,
  // Controles e plataforma
  aimKeySpeed: 230,
  interstitialEveryRuns: 2,
  maxFrameSeconds: 0.05,
  saveVersion: 1,
});

export const REWARD_ID_CONTINUE = 'continue-capsule';
