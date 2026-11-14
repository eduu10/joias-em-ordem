// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { SCREEN } from './config.js';
import { drawText } from './draw.js';
import { drawFx } from './fx.js';
import { drawMatch } from './hud.js';
import { drawCategory, drawHome } from './screens-home.js';
import { drawMuted, drawNoAudio, drawResult, drawShop } from './screens-meta.js';
import { drawBackdrop } from './stage.js';
import { drawToast } from './widgets.js';

export const TOAST_SECONDS = 2.2;

const SCREEN_DRAW = Object.freeze({
  [SCREEN.HOME]: drawHome,
  [SCREEN.CATEGORY]: drawCategory,
  [SCREEN.MATCH]: drawMatch,
  [SCREEN.RESULT]: drawResult,
  [SCREEN.SHOP]: drawShop,
});

export const drawLoading = (ctx, view, strings) => {
  drawBackdrop(ctx, view, 0);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05);
};

// Area visivel inteira, em unidades do desenho: serve para escurecer a tela toda, alem dos 360 x 640.
const boundsOf = (view) => ({
  x: -view.ox / view.scale - 10,
  y: -view.oy / view.scale - 10,
  w: view.width / view.scale + 20,
  h: view.height / view.scale + 20,
});

// `frame`: { profile, match, view, strings, ui }
export const drawScene = (ctx, frame) => {
  const { view, ui } = frame;
  drawBackdrop(ctx, view, ui.time, ui.energy);
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  const full = { ...frame, bounds: boundsOf(view) };

  SCREEN_DRAW[ui.screen](ctx, full);
  drawFx(ctx, ui.fx);
  drawToast(ctx, ui.toast?.text, 382, ui.toast ? Math.min(1, ui.toast.t * 6, (TOAST_SECONDS - ui.toast.t) * 3) : 0);
  if (ui.noAudio) drawNoAudio(ctx, full);
  if (ui.muted) drawMuted(ctx, full);
};
