// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { CAPSULE, CONFIG, PHASE } from './config.js';
import { canDrop, clampAim, LAST_TIER } from './sim.js';
import { tierRadius } from './physics.js';
import { clamp01, easeOutBack } from './ease.js';
import { drawText } from './draw.js';
import { drawBody } from './sprites.js';
import { drawTwinkles } from './world.js';
import { drawFx } from './fx.js';
import { drawCaption, drawDangerLine, drawGuide, drawLadder, drawShout, drawTopBar } from './hud.js';
import { drawOverPanel, drawTitle } from './cards.js';

const SHAKE_PIXELS = 7;
const POP_SECONDS = 0.32;
const POP_SIZE = 0.14;
const GALAXY_SPIN = 0.25;
const HINT_Y = 262;
const WARNING_Y = 196;

export const TOAST_SECONDS = 2.2;
export const SHOUT_SECONDS = 1.4;

// Corpo recem-nascido de uma fusao da um "pulo" de tamanho.
const popScale = (body) => {
  if (body.r0 === tierRadius(body.tier) || body.age >= POP_SECONDS) return 1;
  return 1 + POP_SIZE * Math.sin(Math.PI * clamp01(body.age / POP_SECONDS));
};

const drawBodies = (ctx, frame) => {
  const { state, sprites, ui } = frame;
  state.bodies.forEach((body) => {
    const spin = body.tier === LAST_TIER ? ui.time * GALAXY_SPIN : 0;
    drawBody(ctx, sprites, body.tier, body.x, body.y, body.r * popScale(body), {
      rot: body.rot + spin, squash: ui.squash[body.id] ?? 0,
    });
  });
};

// O corpo na mao do jogador, com a linha-guia.
const drawHeld = (ctx, frame) => {
  const { state, sprites, ui } = frame;
  if (state.phase !== PHASE.PLAY) return;
  const ready = clamp01(1 - state.dropCd / CONFIG.dropCooldown);
  if (ready <= 0) return;
  const radius = tierRadius(state.current);
  const x = clampAim(ui.aimX, state.current);
  const y = CAPSULE.dropY + Math.sin(ui.time * 3.2) * 2;
  if (canDrop(state)) drawGuide(ctx, x, y + radius + 4, ui.drag ? 1 : 0.6);
  drawBody(ctx, sprites, state.current, x, y, radius * Math.max(0.05, easeOutBack(ready)), {
    rot: Math.sin(ui.time * 1.7) * 0.12,
  });
};

const drawCaptions = (ctx, frame) => {
  const { state, strings, ui } = frame;
  if (state.phase !== PHASE.PLAY) return;
  if (state.nextId === 1) drawCaption(ctx, strings.hintDrop, HINT_Y, 0.75 + 0.25 * Math.sin(ui.time * 3));
  else if (state.score === 0 && state.nextId <= 5) drawCaption(ctx, strings.hintMerge, HINT_Y, 0.9);
  if (state.dangerT > CONFIG.dangerSeconds * 0.25) {
    drawCaption(ctx, strings.danger, WARNING_Y, 0.6 + 0.4 * Math.sin(ui.time * 14), '#ffb3c0');
  }
  if (ui.toast) drawCaption(ctx, ui.toast.text, HINT_Y, Math.min(1, ui.toast.t * 6, (TOAST_SECONDS - ui.toast.t) * 3));
};

export const drawLoading = (ctx, view, strings) => {
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  ctx.fillStyle = '#0a0828';
  ctx.fillRect(0, 0, view.width, view.height);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05);
};

// `frame`: { state, view, world, sprites, strings, ui }
export const drawScene = (ctx, frame) => {
  const { state, view, world, sprites, strings, ui } = frame;
  const k = view.ratio * view.scale;
  const bounds = { x: -view.ox / view.scale - 12, y: -view.oy / view.scale - 12, w: view.width / view.scale + 24, h: view.height / view.scale + 24 };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(world.back, 0, 0);
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  drawTwinkles(ctx, bounds, ui.time);

  const shake = ui.shake * ui.shake * SHAKE_PIXELS;
  const sx = Math.sin(ui.time * 70) * shake;
  const sy = Math.cos(ui.time * 55) * shake;
  ctx.setTransform(k, 0, 0, k, (view.ox + sx * view.scale) * view.ratio, (view.oy + sy * view.scale) * view.ratio);
  drawDangerLine(ctx, clamp01(state.dangerT / CONFIG.dangerSeconds), ui.time);
  drawBodies(ctx, frame);
  drawHeld(ctx, frame);
  drawFx(ctx, ui.fx);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(world.front, 0, 0);
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);

  if (state.phase === PHASE.TITLE) {
    drawTitle(ctx, sprites, bounds, strings, state.best, ui.time);
    return;
  }
  drawTopBar(ctx, sprites, { score: state.score, best: state.best, pop: ui.scorePop, next: state.next }, strings);
  drawLadder(ctx, sprites);
  drawCaptions(ctx, frame);
  drawShout(ctx, ui.shout);
  if (state.phase === PHASE.OVER) {
    drawOverPanel(ctx, bounds, { score: state.score, best: state.best, record: ui.record, canRevive: !state.revived }, strings, ui.overT);
  }
};
