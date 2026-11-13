// A pista suspensa em perspectiva: piso, placas alternadas, faixas tracejadas, trilhos de luz, postes e riscos de velocidade.
import { CAMERA, LANE_WIDTH, ROAD_HALF, project } from './camera.js';
import { mix, noise, rgb } from './world.js';

const TAU = Math.PI * 2;
const FAR = 150;
const PANEL_METERS = 7;
const DASH_PERIOD = 5;
const DASH_LENGTH = 2.2;
const DASH_HALF_WIDTH = 0.05;
const RAIL_WIDTH = 0.13;
const POST_GAP = 14;
const POST_HEIGHT = 1.15;
const POST_REACH = 112;
const SPEED_LINES = 16;

const wrap = (value, span) => ((value % span) + span) % span;

// Distancia mais proxima da pista que ainda aparece na tela.
const nearZ = (bottom) => {
  const depth = (CAMERA.height * CAMERA.focal) / Math.max(1, bottom + 6 - CAMERA.horizonY);
  return Math.max(CAMERA.nearDepth, depth) - CAMERA.back;
};

const groundQuad = (ctx, x0, x1, z0, z1, camX) => {
  const a = project(x0, 0, z0, camX);
  const b = project(x1, 0, z0, camX);
  const c = project(x1, 0, z1, camX);
  const d = project(x0, 0, z1, camX);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
};

const drawSurface = (ctx, palette, view, near) => {
  const fill = ctx.createLinearGradient(0, CAMERA.horizonY, 0, view.bottom);
  fill.addColorStop(0, rgb(mix(palette.road, palette.horizon, 0.55)));
  fill.addColorStop(0.25, rgb(mix(palette.road, palette.mid, 0.25)));
  fill.addColorStop(1, rgb(mix(palette.road, [20, 14, 52], 0.35)));
  ctx.fillStyle = fill;
  ctx.beginPath();
  groundQuad(ctx, -ROAD_HALF, ROAD_HALF, near, FAR, view.camX);
  ctx.fill();

  // Placas alternadas: sao elas que mais passam a sensacao de velocidade.
  const offset = wrap(view.distance, PANEL_METERS * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
  ctx.beginPath();
  for (let z = -offset - PANEL_METERS * 2; z < FAR; z += PANEL_METERS * 2) {
    const from = Math.max(near, z);
    const to = Math.min(FAR, z + PANEL_METERS);
    if (to > from) groundQuad(ctx, -ROAD_HALF, ROAD_HALF, from, to, view.camX);
  }
  ctx.fill();
};

const drawDashes = (ctx, view, near) => {
  const offset = wrap(view.distance, DASH_PERIOD);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.beginPath();
  for (let z = -offset - DASH_PERIOD; z < 120; z += DASH_PERIOD) {
    const from = Math.max(near, z);
    const to = z + DASH_LENGTH;
    if (to <= from) continue;
    [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach((x) => {
      groundQuad(ctx, x - DASH_HALF_WIDTH, x + DASH_HALF_WIDTH, from, to, view.camX);
    });
  }
  ctx.fill();
};

const drawRails = (ctx, palette, view, near) => {
  const glow = rgb(mix(palette.sun, [120, 240, 255], 0.55), 0.22);
  const core = rgb(mix(palette.sun, [170, 250, 255], 0.6));
  [-1, 1].forEach((side) => {
    ctx.fillStyle = glow;
    ctx.beginPath();
    groundQuad(ctx, side * (ROAD_HALF - RAIL_WIDTH * 3), side * (ROAD_HALF + RAIL_WIDTH), near, FAR, view.camX);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    groundQuad(ctx, side * (ROAD_HALF - RAIL_WIDTH), side * ROAD_HALF, near, FAR, view.camX);
    ctx.fill();
  });
};

// Neblina clara perto do horizonte, para a pista sumir suave ao longe.
const drawHaze = (ctx, palette, bounds) => {
  const haze = ctx.createLinearGradient(0, CAMERA.horizonY, 0, CAMERA.horizonY + 46);
  haze.addColorStop(0, rgb(mix(palette.horizon, palette.sea, 0.4), 0.95));
  haze.addColorStop(1, rgb(palette.horizon, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(bounds.x, CAMERA.horizonY - 1, bounds.w, 48);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} palette resultado de skyPalette
 * @param {{distance: number, camX: number, bottom: number}} view
 * @param {{x: number, y: number, w: number, h: number}} bounds area visivel
 */
export const drawRoad = (ctx, palette, view, bounds) => {
  const near = nearZ(view.bottom);
  drawSurface(ctx, palette, view, near);
  drawDashes(ctx, view, near);
  drawRails(ctx, palette, view, near);
  drawHaze(ctx, palette, bounds);
};

const drawPost = (ctx, side, z, palette, camX) => {
  const x = side * (ROAD_HALF + 0.12);
  const foot = project(x, 0, z, camX);
  const top = project(x, POST_HEIGHT, z, camX);
  if (foot.scale < 6) return;
  ctx.strokeStyle = rgb(mix(palette.road, [230, 230, 255], 0.35));
  ctx.lineWidth = Math.max(1, foot.scale * 0.05);
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  const radius = Math.max(1.2, foot.scale * 0.085);
  ctx.fillStyle = rgb(mix(palette.sun, [140, 245, 255], 0.5), 0.22);
  ctx.beginPath();
  ctx.arc(top.x, top.y, radius * 2.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4ffff';
  ctx.beginPath();
  ctx.arc(top.x, top.y, radius, 0, TAU);
  ctx.fill();
};

// Postes de luz dos dois lados, como itens da lista de desenho (ordenada por distancia).
export const roadPosts = (ctx, palette, view) => {
  const offset = wrap(view.distance, POST_GAP);
  const posts = [];
  for (let z = -offset; z < POST_REACH; z += POST_GAP) {
    if (z + CAMERA.back < 4) continue;
    posts.push({ z, draw: () => { drawPost(ctx, -1, z, palette, view.camX); drawPost(ctx, 1, z, palette, view.camX); } });
  }
  return posts;
};

// Riscos que saem do ponto de fuga quando a corrida esta rapida. `intensity` vai de 0 a 1.
export const drawSpeedLines = (ctx, intensity, time) => {
  if (intensity <= 0.02) return;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  for (let i = 0; i < SPEED_LINES; i += 1) {
    // Angulos so para os lados e para cima: nada de riscos em cima da pista.
    const spread = noise(i, 41) * 1.6 - 0.5;
    const angle = i % 2 === 0 ? Math.PI + spread : -spread;
    const phase = (time * (1.1 + noise(i, 42) * 0.9) + noise(i, 43)) % 1;
    const start = 90 + phase * 380;
    const length = 22 + phase * 90;
    ctx.globalAlpha = intensity * Math.sin(phase * Math.PI) * 0.4;
    ctx.lineWidth = 1 + phase * 1.6;
    ctx.beginPath();
    ctx.moveTo(CAMERA.centerX + Math.cos(angle) * start, CAMERA.horizonY + Math.sin(angle) * start * 0.8);
    ctx.lineTo(CAMERA.centerX + Math.cos(angle) * (start + length), CAMERA.horizonY + Math.sin(angle) * (start + length) * 0.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
