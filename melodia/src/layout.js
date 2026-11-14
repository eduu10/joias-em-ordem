// Posicoes de tudo que e tocavel, no espaco de 360 x 640. O desenho e o toque usam os mesmos retangulos.
import { CATEGORY, CONFIG, SHOP_ITEMS } from './config.js';

const rect = (x, y, w, h) => Object.freeze({ x, y, w, h });

export const inRect = (area, x, y) =>
  x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;

export const BACK_BUTTON = rect(12, 14, 92, 34);

export const HOME = Object.freeze({
  level: rect(12, 14, 124, 34),
  coins: rect(240, 14, 108, 34),
  vinyl: Object.freeze({ x: 180, y: 178, r: 74 }),
  play: rect(56, 396, 248, 66),
  shop: rect(56, 476, 248, 48),
  ad: rect(56, 536, 248, 46),
});

export const CATEGORY_CARDS = Object.freeze({
  [CATEGORY.CLASSICAL]: rect(16, 96, 158, 148),
  [CATEGORY.STAGE]: rect(186, 96, 158, 148),
  [CATEGORY.FOLK]: rect(16, 256, 158, 148),
  [CATEGORY.CANTIGAS]: rect(186, 256, 158, 148),
  [CATEGORY.MIX]: rect(16, 416, 328, 104),
});

const CARD_TOP = 362;
const CARD_STEP = 68;
export const MATCH = Object.freeze({
  player: rect(10, 10, 138, 62),
  rival: rect(212, 10, 138, 62),
  vinyl: Object.freeze({ x: 180, y: 186, r: 68 }),
  ring: 84,
  prompt: 292,
  eq: rect(44, 306, 272, 40),
  reveal: rect(24, 276, 312, 76),
  cards: Object.freeze(Array.from({ length: CONFIG.options }, (_, i) => rect(24, CARD_TOP + i * CARD_STEP, 312, 58))),
});

export const RESULT = Object.freeze({
  card: rect(24, 62, 312, 516),
  a: rect(48, 420, 264, 52),
  b: rect(48, 482, 264, 44),
  c: rect(48, 534, 264, 34),
});

// Aviso de navegador sem som: um botao so, de volta ao inicio.
export const NO_AUDIO = Object.freeze({ home: rect(56, 470, 248, 56) });

const SHOP_TOP = 70;
const SHOP_STEP = 94;
export const SHOP = Object.freeze({
  coins: rect(240, 14, 108, 34),
  rows: Object.freeze(SHOP_ITEMS.map((_, i) => rect(16, SHOP_TOP + i * SHOP_STEP, 328, 84))),
  action: (row) => rect(row.x + row.w - 112, row.y + 22, 100, 40),
});
