// Numeros de balanceamento. O jogo e desenhado num espaco fixo de 360 x 640 e escalado para a tela.
export const DESIGN = Object.freeze({ w: 360, h: 640 });

export const SCREEN = Object.freeze({
  HOME: 'home', CATEGORY: 'category', MATCH: 'match', RESULT: 'result', SHOP: 'shop',
});

export const PHASE = Object.freeze({ READY: 'ready', PLAY: 'play', FEEDBACK: 'feedback', DONE: 'done' });

export const OUTCOME = Object.freeze({ WIN: 'win', TIE: 'tie', LOSE: 'lose' });

export const CATEGORY = Object.freeze({
  CLASSICAL: 'classical', STAGE: 'stage', FOLK: 'folk', CANTIGAS: 'cantigas', MIX: 'mix',
});

// Ordem em que as categorias aparecem na tela de escolha.
export const CATEGORY_ORDER = Object.freeze([
  CATEGORY.CLASSICAL, CATEGORY.STAGE, CATEGORY.FOLK, CATEGORY.CANTIGAS, CATEGORY.MIX,
]);

export const CONFIG = Object.freeze({
  rounds: 5,
  options: 4,
  roundSeconds: 10,
  readySeconds: 1.1,
  feedbackSeconds: 2.8,
  maxPoints: 100,
  minCorrectPoints: 10,

  // Rival controlado pelo jogo: fica mais rapido e mais certeiro conforme o nivel do jogador.
  rivalAccuracyBase: 0.48,
  rivalAccuracyPerLevel: 0.025,
  rivalAccuracyMax: 0.8,
  rivalDelayMin: 3.4,
  rivalDelayMax: 8.6,
  rivalDelayPerLevel: 0.12,
  rivalDelayFloorMin: 2.2,
  rivalDelayFloorMax: 5.6,

  coinsWin: 30,
  coinsTie: 15,
  coinsLose: 5,
  streakBonusPerWin: 5,
  streakBonusCap: 25,
  doubleCoinsFactor: 2,
  homeAdCoins: 50,
  xpPerPoint: 0.2,
  xpWin: 30,
  xpTie: 15,
  xpLose: 8,
  xpLevelBase: 60,
  xpLevelStep: 30,
  maxLevel: 99,

  recentLimit: 14,
  interstitialEveryMatches: 3,
  tuneGapBeats: 3,
  maxFrameSeconds: 0.05,
  saveVersion: 1,
});

// Itens da lojinha: so enfeite. `kind` diz o que o item troca.
export const SHOP_KIND = Object.freeze({ INSTRUMENT: 'instrument', FRAME: 'frame' });

export const SHOP_ITEMS = Object.freeze([
  Object.freeze({ id: 'frame-gold', kind: SHOP_KIND.FRAME, price: 80 }),
  Object.freeze({ id: 'inst-musicbox', kind: SHOP_KIND.INSTRUMENT, price: 120, preset: 'musicbox' }),
  Object.freeze({ id: 'frame-neon', kind: SHOP_KIND.FRAME, price: 160 }),
  Object.freeze({ id: 'inst-strings', kind: SHOP_KIND.INSTRUMENT, price: 200, preset: 'strings' }),
  Object.freeze({ id: 'frame-star', kind: SHOP_KIND.FRAME, price: 260 }),
]);

export const REWARD_ID_REMATCH = 'rematch-double-coins';
export const REWARD_ID_HOME_COINS = 'home-bonus-coins';
