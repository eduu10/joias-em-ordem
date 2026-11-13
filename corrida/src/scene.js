// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { CONFIG, PHASE } from './config.js';
import { cameraX, laneX, project } from './camera.js';
import { scoreOf, speedAt } from './sim.js';
import { drawSky, skyPalette } from './world.js';
import { drawCloudSea, drawIslands } from './scenery.js';
import { drawRoad, drawSpeedLines, roadPosts } from './road.js';
import { drawObstacle } from './obstacles.js';
import { drawItem } from './items.js';
import { drawRobot, drawRobotShadow } from './robot.js';
import { drawFx } from './fx.js';
import { drawCaption, drawHud, drawOverPanel, drawTitle } from './hud.js';
import { drawText } from './draw.js';
import { clamp01 } from './ease.js';

const SHAKE_PIXELS = 7;
const SPEED_LINES_FROM = 14;
const HINT_METERS = 70;
const MAGNET_WARN_SECONDS = 1.4;
export const TOAST_SECONDS = 2.2;
export const OVER_CARD_DELAY = 0.55;

const playerPose = (frame, camX) => {
  const { state, ui } = frame;
  const foot = project(laneX(state.x), state.y, 0, camX);
  const blinking = state.invulnT > 0 && Math.sin(ui.time * 32) > 0;
  const magnetOn = state.magnetT > MAGNET_WARN_SECONDS || (state.magnetT > 0 && Math.sin(ui.time * 22) > 0);
  return {
    x: foot.x,
    y: foot.y,
    scale: foot.scale,
    phase: ui.runPhase,
    time: ui.time,
    air: state.y,
    vy: state.vy,
    slide: ui.slideAmount,
    tilt: (state.lane - state.x) * 0.3,
    running: state.phase === PHASE.RUN,
    front: state.phase === PHASE.TITLE,
    alpha: blinking ? 0.4 : 1,
    shield: state.shield,
    magnet: magnetOn,
    crash: state.phase === PHASE.OVER ? ui.overT : -1,
  };
};

// Tudo o que fica em cima da pista, do mais longe para o mais perto.
const drawActors = (ctx, frame, palette, view) => {
  const { state } = frame;
  const pose = playerPose(frame, view.camX);
  const ground = project(laneX(state.x), 0, 0, view.camX);
  drawRobotShadow(ctx, ground.x, ground.y, ground.scale, state.y);
  const actors = [
    ...roadPosts(ctx, palette, view),
    ...state.obstacles.map((obstacle) => {
      const z = obstacle.z - view.distance;
      return { z, draw: () => drawObstacle(ctx, obstacle, z, view) };
    }),
    ...state.items.map((item) => {
      const zRel = item.z - view.distance;
      return { z: zRel, draw: () => (zRel > -2 ? drawItem(ctx, { ...item, zRel }, view) : null) };
    }),
    { z: 0, draw: () => drawRobot(ctx, pose) },
  ];
  actors.sort((a, b) => b.z - a.z).forEach((actor) => actor.draw());
};

const drawOverlay = (ctx, frame, bounds) => {
  const { state, strings, ui } = frame;
  if (state.phase === PHASE.TITLE) {
    drawTitle(ctx, bounds, strings, state.best, ui.time);
    return;
  }
  drawHud(ctx, {
    distance: state.distance, coins: state.coins, coinPop: ui.coinPop, magnetT: state.magnetT, shield: state.shield,
  }, strings);
  if (state.phase === PHASE.RUN && ui.firstRun && !state.revived) {
    drawCaption(ctx, strings.hintSwipe, 600, Math.min(state.distance / 6, (HINT_METERS - state.distance) / 10));
  }
  drawCaption(ctx, ui.toast?.text, 124, ui.toast ? Math.min(1, ui.toast.t * 6, (TOAST_SECONDS - ui.toast.t) * 3) : 0);
  if (state.phase === PHASE.OVER) {
    const score = scoreOf(state);
    drawOverPanel(ctx, bounds, {
      score,
      distance: Math.floor(state.distance),
      coins: state.coins,
      best: state.best,
      isBest: score > ui.bestAtStart,
      canRevive: !state.revived,
    }, strings, ui.overT - OVER_CARD_DELAY);
  }
};

export const drawLoading = (ctx, view, strings) => {
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, view.height);
  sky.addColorStop(0, '#2c1860');
  sky.addColorStop(1, '#ffa460');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.width, view.height);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05);
};

// `frame`: { state, view, strings, ui }
export const drawScene = (ctx, frame) => {
  const { state, view, ui } = frame;
  const k = view.ratio * view.scale;
  const shake = ui.shake * SHAKE_PIXELS;
  ctx.setTransform(k, 0, 0, k,
    (view.ox + Math.sin(ui.time * 70) * shake) * view.ratio,
    (view.oy + Math.cos(ui.time * 55) * shake) * view.ratio);
  const bounds = { x: -view.ox / view.scale - 12, y: -view.oy / view.scale - 12, w: view.width / view.scale + 24, h: view.height / view.scale + 24 };
  const title = state.phase === PHASE.TITLE;
  const distance = title ? ui.titleScroll : state.distance;
  const palette = skyPalette(distance);
  const sceneView = { distance, camX: cameraX(state.x), time: ui.time, bottom: bounds.y + bounds.h };

  drawSky(ctx, bounds, palette, sceneView);
  drawCloudSea(ctx, palette, sceneView);
  drawIslands(ctx, palette, sceneView);
  drawRoad(ctx, palette, sceneView, bounds);
  drawActors(ctx, frame, palette, sceneView);
  if (state.phase === PHASE.RUN) {
    const fast = clamp01((speedAt(distance) - SPEED_LINES_FROM) / (CONFIG.maxSpeed - SPEED_LINES_FROM));
    drawSpeedLines(ctx, fast, ui.time);
  }
  drawFx(ctx, ui.fx);
  if (ui.flash > 0) {
    ctx.fillStyle = `rgba(${ui.flashColor}, ${ui.flash * 0.55})`;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  drawOverlay(ctx, frame, bounds);
};

// Onde o robo e as coisas do mundo aparecem na tela: usado para soltar efeitos no lugar certo.
export const playerScreenPoint = (state) => {
  const point = project(laneX(state.x), state.y, 0, cameraX(state.x));
  return { x: point.x, y: point.y };
};

export const worldScreenPoint = (state, lane, h, z) => {
  const point = project(laneX(lane), h, Math.max(-2, z - state.distance), cameraX(state.x));
  return { x: point.x, y: point.y };
};
