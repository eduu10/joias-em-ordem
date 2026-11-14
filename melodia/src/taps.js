// Descobre em que o jogador tocou. Devolve uma chave ("play", "card:2", "item:frame-gold"...) ou null.
// Funcao pura: usa os mesmos retangulos do desenho e nao altera nada.
import { CATEGORY_ORDER, PHASE, SCREEN, SHOP_ITEMS } from './config.js';
import { BACK_BUTTON, CATEGORY_CARDS, HOME, MATCH, SHOP, inRect } from './layout.js';
import { resultButtons } from './screens-meta.js';

const RESULT_INPUT_DELAY = 0.7;

const homeTarget = (frame, x, y) => {
  if (inRect(HOME.play, x, y)) return 'play';
  if (inRect(HOME.shop, x, y)) return 'shop';
  return frame.profile.adReady && inRect(HOME.ad, x, y) ? 'homeAd' : null;
};

const categoryTarget = (frame, x, y) => {
  if (inRect(BACK_BUTTON, x, y)) return 'back';
  const category = CATEGORY_ORDER.find((id) => inRect(CATEGORY_CARDS[id], x, y));
  return category ? `cat:${category}` : null;
};

const matchTarget = (frame, x, y) => {
  if (frame.match?.phase !== PHASE.PLAY) return null;
  const index = MATCH.cards.findIndex((card) => inRect(card, x, y));
  return index >= 0 ? `card:${index}` : null;
};

const resultTarget = (frame, x, y) => {
  if (frame.ui.screenT < RESULT_INPUT_DELAY || !frame.ui.summary) return null;
  return resultButtons(frame.ui.summary).find((button) => inRect(button.area, x, y))?.key ?? null;
};

const shopTarget = (frame, x, y) => {
  if (inRect(BACK_BUTTON, x, y)) return 'back';
  const index = SHOP.rows.findIndex((row) => inRect(row, x, y));
  return index >= 0 ? `item:${SHOP_ITEMS[index].id}` : null;
};

const TARGETS = Object.freeze({
  [SCREEN.HOME]: homeTarget,
  [SCREEN.CATEGORY]: categoryTarget,
  [SCREEN.MATCH]: matchTarget,
  [SCREEN.RESULT]: resultTarget,
  [SCREEN.SHOP]: shopTarget,
});

// `frame`: { profile, match, ui }
export const tapTarget = (frame, x, y) => TARGETS[frame.ui.screen](frame, x, y);
