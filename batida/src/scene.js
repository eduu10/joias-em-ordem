// Monta um quadro inteiro: mundo (camera em pixels de tela) e interface (espaco 360 x 640). Nao altera nada.
import { DESIGN, PHASE } from './config.js';
import { CARS, TARGET_CAR } from './cars.js';
import { TRACKS } from './tracks.js';
import { drawBackdrop, drawStatics } from './backdrop.js';
import { drawCar, drawDebris, drawDummies, drawProps } from './cardraw.js';
import { drawFx, drawMarks } from './fx.js';
import { drawAim, drawGarage, drawRunHud, drawTitle, drawToast, drawTracks } from './hud.js';
import { drawReplayOverlay, drawResults } from './results.js';
import { drawCarPreview, drawTrackIcon } from './icons.js';
import { drawText } from './draw.js';

const SHAKE_PIXELS = 10;

export const drawLoading = (ctx, view, strings) => {
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  ctx.fillStyle = '#7cc4ef';
  ctx.fillRect(0, 0, view.width, view.height);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05);
};

const drawWorld = (ctx, frame, run, world) => {
  const { view, ui } = frame;
  const cam = ui.cam;
  const shake = ui.shake * ui.shake * SHAKE_PIXELS;
  ctx.setTransform(view.ratio, 0, 0, view.ratio,
    Math.sin(ui.time * 63) * shake * view.ratio, Math.cos(ui.time * 51) * shake * view.ratio);
  drawBackdrop(ctx, cam, run.track, ui.time);
  drawStatics(ctx, cam, world.statics, ui.time);
  drawMarks(ctx, cam, ui.marks);
  drawProps(ctx, cam, world.props);
  drawDebris(ctx, cam, world.debris, run.car);
  if (world.bodies[1]) drawCar(ctx, cam, world.bodies[1], TARGET_CAR, []);
  drawCar(ctx, cam, world.bodies[0], run.car, world.dummies);
  drawDummies(ctx, cam, world.dummies);
  drawFx(ctx, cam, ui.fx);
  if (ui.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${ui.flash * 0.5})`;
    ctx.fillRect(-20, -20, view.width + 40, view.height + 40);
  }
};

const garageInfo = (frame) => {
  const { app } = frame;
  const def = CARS[app.carIndex];
  const owned = app.profile.cars.includes(def.id) || app.trialCar === def.id;
  return {
    def,
    name: frame.strings.cars[def.id],
    stats: [def.mass / 9000, def.stiff / 0.8, def.len / 10.5],
    owned,
    trial: app.trialCar === def.id,
    price: def.price,
    canBuy: app.profile.coins >= def.price,
    canTry: !app.profile.tried.includes(def.id),
    index: app.carIndex,
    count: CARS.length,
  };
};

const trackCards = (frame) => {
  const { app, strings } = frame;
  return TRACKS.map((track) => {
    const owned = app.profile.tracks.includes(track.id);
    return {
      name: strings.trackNames[track.id],
      best: app.profile.best[track.id] ?? 0,
      price: track.price,
      owned,
      canBuy: app.profile.coins >= track.price,
      selected: app.profile.track === track.id,
      draw: (c, x, y, w, h) => drawTrackIcon(c, track.id, x, y, w, h, !owned),
    };
  });
};

const dim = (ctx, bounds, alpha) => {
  ctx.fillStyle = `rgba(16, 40, 70, ${alpha})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
};

const drawInterface = (ctx, frame, bounds) => {
  const { app, strings, ui } = frame;
  switch (app.phase) {
    case PHASE.TITLE:
      drawTitle(ctx, strings, ui.phaseT, app.bestTotal);
      break;
    case PHASE.GARAGE: {
      dim(ctx, bounds, 0.45);
      const info = garageInfo(frame);
      drawCarPreview(ctx, info.def, DESIGN.w / 2, 300, 250, ui.time);
      drawGarage(ctx, strings, info, app.profile.coins, ui.time);
      break;
    }
    case PHASE.TRACKS:
      dim(ctx, bounds, 0.5);
      drawTracks(ctx, strings, trackCards(frame), app.profile.coins);
      break;
    case PHASE.AIM:
      drawAim(ctx, strings, app.meter, app.aimKmh, `${strings.cars[app.run.car.id]} · ${strings.trackNames[app.run.track.id]}`);
      break;
    case PHASE.RUN:
      drawRunHud(ctx, strings, app.kmh, ui.banner);
      break;
    case PHASE.RESULT:
      dim(ctx, bounds, Math.min(0.35, ui.phaseT));
      drawResults(ctx, strings, {
        score: app.score, coins: app.coinsWon, record: app.record, doubled: app.doubled,
        canDouble: !app.doubled, profileCoins: app.profile.coins, t: ui.phaseT,
      });
      break;
    case PHASE.REPLAY:
      drawReplayOverlay(ctx, strings, bounds, ui.time);
      break;
    default:
  }
  drawToast(ctx, ui.toast);
};

// `frame`: { app, view, strings, ui, world } (world = mundo a desenhar, ja escolhido pelo main)
export const drawScene = (ctx, frame) => {
  const { view, app } = frame;
  const run = app.run ?? app.demo;
  drawWorld(ctx, frame, run, frame.world ?? run.world);
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  const bounds = { x: -view.ox / view.scale, y: -view.oy / view.scale, w: view.width / view.scale, h: view.height / view.scale };
  drawInterface(ctx, frame, bounds);
};
