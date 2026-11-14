// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { PHASE, SCREEN } from './config.js';
import { drawText } from './draw.js';
import { drawFx } from './fx.js';
import { drawGame } from './hud.js';
import { drawHome, drawMuted, drawOver } from './screens.js';
import { drawDecor, drawFloor, drawSky } from './stage.js';
import { drawToast } from './widgets.js';

export const TOAST_SECONDS = 2.4;

const boundsOf = (view) => ({
  x: -view.ox / view.scale - 10,
  y: -view.oy / view.scale - 10,
  w: view.width / view.scale + 20,
  h: view.height / view.scale + 20,
});

const designTransform = (ctx, view) => {
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
};

export const drawLoading = (ctx, view, strings) => {
  designTransform(ctx, view);
  const bounds = boundsOf(view);
  drawSky(ctx, bounds, 0);
  drawFloor(ctx, bounds);
  drawText(ctx, strings.loading, 180, 320, 20);
};

// `frame`: { game, save, today, view, strings, ui, canRevive }
export const drawScene = (ctx, frame) => {
  const { view, ui, game } = frame;
  designTransform(ctx, view);
  const bounds = boundsOf(view);
  const full = { ...frame, bounds };
  drawSky(ctx, bounds, ui.time);
  drawFloor(ctx, bounds);
  drawDecor(ctx, bounds, ui.time, ui.beat);
  if (ui.screen === SCREEN.HOME || !game) drawHome(ctx, full);
  else {
    drawGame(ctx, full);
    if (game.phase === PHASE.OVER) drawOver(ctx, full);
  }
  drawFx(ctx, ui.fx);
  drawToast(ctx, ui.toast?.text, 108, ui.toast ? Math.min(1, ui.toast.t * 6, (TOAST_SECONDS - ui.toast.t) * 3) : 0);
  if (ui.muted) drawMuted(ctx, full);
};
