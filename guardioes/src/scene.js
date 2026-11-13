// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { DESIGN, PHASE, SLOTS } from './config.js';
import { pathPoint } from './path.js';
import { buyCost, canBuy, canMerge, heroRange } from './sim.js';
import { drawEnemy, drawHero, drawRange, drawShot, drawSlotGlow } from './actors.js';
import { drawFx } from './fx.js';
import { drawBanner, drawBuyButton, drawCaption, drawOverPanel, drawTitle, drawTopBar } from './hud.js';
import { drawText } from './draw.js';

const SHAKE_PIXELS = 5;

const captionFor = (frame) => {
  const { state, strings, ui } = frame;
  if (state.phase !== PHASE.BUILD && state.phase !== PHASE.WAVE) return '';
  if (state.bought === 0) return strings.hintBuy;
  if (!ui.mergedOnce && state.heroes.filter(Boolean).length >= 2) return strings.hintMerge;
  if (state.phase === PHASE.BUILD) return `${strings.nextWave} ${Math.ceil(state.timer)}`;
  return '';
};

const drawActors = (ctx, frame) => {
  const { state, ui } = frame;
  const pulse = 0.5 + 0.5 * Math.sin(ui.time * 7);
  const dragged = ui.drag ? state.heroes[ui.drag.slot] : null;

  if (dragged) {
    SLOTS.forEach((slot, index) => {
      if (canMerge(state, ui.drag.slot, index)) drawSlotGlow(ctx, slot, dragged.tier, pulse);
    });
    if (ui.drag.over >= 0) drawRange(ctx, SLOTS[ui.drag.over], heroRange(dragged.tier), dragged.tier);
  }

  // Quem esta mais embaixo na tela e desenhado por ultimo, para ficar na frente.
  const actors = [];
  state.heroes.forEach((hero, index) => {
    if (!hero) return;
    const slot = SLOTS[index];
    const beingDragged = ui.drag && ui.drag.slot === index;
    actors.push({
      y: slot.y,
      draw: () => drawHero(ctx, slot.x, slot.y, hero.tier, {
        time: ui.time, recoil: ui.recoil[index] ?? 0, alpha: beingDragged ? 0.3 : 1,
      }),
    });
  });
  state.enemies.forEach((enemy) => {
    const point = pathPoint(enemy.d);
    actors.push({ y: point.y, draw: () => drawEnemy(ctx, enemy, point.x, point.y, ui.time) });
  });
  actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());

  state.shots.forEach((shot) => drawShot(ctx, shot));
  drawFx(ctx, ui.fx);
  if (dragged) drawHero(ctx, ui.drag.x, ui.drag.y + 12, dragged.tier, { time: ui.time, lifted: true });
};

export const drawLoading = (ctx, view, strings) => {
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  ctx.fillStyle = '#4fae45';
  ctx.fillRect(0, 0, view.width, view.height);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05);
};

// `frame`: { state, view, world, strings, ui }
export const drawScene = (ctx, frame) => {
  const { state, view, world, strings, ui } = frame;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(world, 0, 0);

  const k = view.ratio * view.scale;
  const shake = ui.shake * SHAKE_PIXELS;
  ctx.setTransform(k, 0, 0, k,
    (view.ox + Math.sin(ui.time * 70) * shake) * view.ratio,
    (view.oy + Math.cos(ui.time * 55) * shake) * view.ratio);
  const bounds = { x: -view.ox / view.scale - 10, y: -view.oy / view.scale - 10, w: view.width / view.scale + 20, h: view.height / view.scale + 20 };

  drawActors(ctx, frame);
  if (ui.shake > 0) {
    ctx.fillStyle = `rgba(255, 40, 60, ${ui.shake * 0.22})`;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (state.phase === PHASE.TITLE) {
    drawTitle(ctx, bounds, strings, state.best, ui.time);
    return;
  }
  drawTopBar(ctx, { wave: state.wave, coins: state.coins, baseHp: state.baseHp, hpFlash: ui.shake, coinPop: ui.coinPop }, strings);
  drawBuyButton(ctx, { cost: buyCost(state.bought), enabled: canBuy(state), pressed: ui.buyPressed > 0 }, strings);
  drawCaption(ctx, captionFor(frame), 532);
  drawCaption(ctx, ui.toast?.text, 150, ui.toast ? Math.min(1, ui.toast.t * 6, (2.2 - ui.toast.t) * 3) : 0);
  drawBanner(ctx, ui.banner);
  if (state.best > 0) drawText(ctx, `${strings.best} ${state.best}`, DESIGN.w / 2, 628, 10, { color: '#eaffd9', weight: 600 });

  if (state.phase === PHASE.OVER) {
    drawOverPanel(ctx, bounds, { wave: state.wave, best: state.best, canRevive: !state.revived }, strings, ui.overT);
  }
};

export const BANNER_SECONDS = 1.5;
export const TOAST_SECONDS = 2.2;
