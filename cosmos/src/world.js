// Cenario: espaco profundo com nebulosas e a capsula de vidro.
// O que nao se mexe e desenhado uma vez em dois canvas auxiliares: `back` (atras dos corpos) e `front` (na frente).
import { CAPSULE } from './config.js';
import { roundRectPath } from './draw.js';
import { TAU, disc, noise } from './paint.js';

const WALL = 6;
const CAP = 14;
const DUST_COUNT = 170;
const TWINKLE_COUNT = 44;
const COMET_EVERY = 6.5;
const COMET_SECONDS = 0.9;
const NEBULAS = Object.freeze([
  [0.2, 0.18, 0.55, [282, 85, 48], 0.3], [0.85, 0.3, 0.5, [205, 90, 46], 0.24], [0.15, 0.7, 0.6, [325, 85, 46], 0.2],
  [0.8, 0.82, 0.55, [250, 85, 50], 0.26], [0.5, 0.5, 0.45, [180, 80, 40], 0.12],
]);

const tube = Object.freeze({
  x: CAPSULE.left - WALL, y: CAPSULE.top, w: CAPSULE.right - CAPSULE.left + WALL * 2, h: CAPSULE.floor - CAPSULE.top,
});

const drawSpace = (ctx, bounds) => {
  const sky = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.h);
  sky.addColorStop(0, '#04051a');
  sky.addColorStop(0.5, '#120a36');
  sky.addColorStop(1, '#22104a');
  ctx.fillStyle = sky;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  ctx.globalCompositeOperation = 'lighter';
  const span = Math.max(bounds.w, bounds.h);
  NEBULAS.forEach(([fx, fy, size, [h, s, l], alpha]) => {
    const x = bounds.x + fx * bounds.w;
    const y = bounds.y + fy * bounds.h;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, span * size);
    cloud.addColorStop(0, `hsl(${h} ${s}% ${l}% / ${alpha})`);
    cloud.addColorStop(0.5, `hsl(${h} ${s}% ${l}% / ${alpha * 0.35})`);
    cloud.addColorStop(1, `hsl(${h} ${s}% ${l}% / 0)`);
    disc(ctx, x, y, span * size, cloud);
  });
  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0; i < DUST_COUNT; i += 1) {
    const tint = ['255, 255, 255', '190, 215, 255', '255, 220, 240'][i % 3];
    disc(ctx, bounds.x + noise(i, 1) * bounds.w, bounds.y + noise(i, 2) * bounds.h, 0.3 + noise(i, 3) * 0.7, `rgba(${tint}, ${0.25 + noise(i, 4) * 0.5})`);
  }
};

const drawGlassBack = (ctx) => {
  const inside = ctx.createLinearGradient(0, tube.y, 0, tube.y + tube.h);
  inside.addColorStop(0, 'rgba(18, 14, 60, 0.62)');
  inside.addColorStop(1, 'rgba(8, 6, 34, 0.74)');
  ctx.fillStyle = inside;
  ctx.fillRect(tube.x, tube.y, tube.w, tube.h);
  const tint = ctx.createLinearGradient(tube.x, 0, tube.x + tube.w, 0);
  tint.addColorStop(0, 'rgba(140, 190, 255, 0.16)');
  tint.addColorStop(0.2, 'rgba(140, 190, 255, 0.02)');
  tint.addColorStop(0.8, 'rgba(190, 140, 255, 0.02)');
  tint.addColorStop(1, 'rgba(190, 140, 255, 0.14)');
  ctx.fillStyle = tint;
  ctx.fillRect(tube.x, tube.y, tube.w, tube.h);
  const floorGlow = ctx.createLinearGradient(0, CAPSULE.floor - 70, 0, CAPSULE.floor);
  floorGlow.addColorStop(0, 'rgba(120, 220, 255, 0)');
  floorGlow.addColorStop(1, 'rgba(120, 220, 255, 0.16)');
  ctx.fillStyle = floorGlow;
  ctx.fillRect(tube.x, CAPSULE.floor - 70, tube.w, 70);
};

// Tampa e base de metal, com luzinhas.
const drawCap = (ctx, y, lights) => {
  const x = tube.x - 8;
  const w = tube.w + 16;
  const metal = ctx.createLinearGradient(0, y, 0, y + CAP);
  metal.addColorStop(0, '#aab4e6');
  metal.addColorStop(0.35, '#646ca8');
  metal.addColorStop(1, '#2c2a5c');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  roundRectPath(ctx, x, y, w, CAP, CAP / 2);
  ctx.fillStyle = metal;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(x + 10, y + 2.2, w - 20, 1.2);
  for (let i = 0; i < lights; i += 1) {
    const lx = x + 22 + (i * (w - 44)) / (lights - 1);
    disc(ctx, lx, y + CAP * 0.58, 3.6, `hsl(${180 + i * 22} 100% 70% / 0.25)`);
    disc(ctx, lx, y + CAP * 0.58, 1.7, `hsl(${180 + i * 22} 100% 78%)`);
  }
};

const drawGlassFront = (ctx) => {
  [[tube.x, 1], [tube.x + tube.w - WALL, -1]].forEach(([x, side]) => {
    const wall = ctx.createLinearGradient(x, 0, x + WALL, 0);
    wall.addColorStop(side > 0 ? 0 : 1, 'rgba(200, 230, 255, 0.6)');
    wall.addColorStop(0.5, 'rgba(160, 190, 255, 0.2)');
    wall.addColorStop(side > 0 ? 1 : 0, 'rgba(255, 255, 255, 0.42)');
    ctx.fillStyle = wall;
    ctx.fillRect(x, tube.y, WALL, tube.h);
  });
  // Reflexos compridos no vidro.
  [[CAPSULE.left + 9, 7, 0.13], [CAPSULE.left + 21, 2.5, 0.1], [CAPSULE.right - 15, 3, 0.07]].forEach(([x, width, alpha]) => {
    const shine = ctx.createLinearGradient(0, tube.y, 0, tube.y + tube.h);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shine.addColorStop(0.12, `rgba(255, 255, 255, ${alpha})`);
    shine.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.5})`);
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    roundRectPath(ctx, x, tube.y + 16, width, tube.h - 40, width / 2);
    ctx.fillStyle = shine;
    ctx.fill();
  });
  drawCap(ctx, CAPSULE.top - CAP + 2, 2);
  drawCap(ctx, CAPSULE.floor, 7);
};

const boundsOf = (view) => ({
  x: -view.ox / view.scale, y: -view.oy / view.scale, w: view.width / view.scale, h: view.height / view.scale,
});

const makeLayer = (view, paint) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(view.width * view.ratio);
  canvas.height = Math.round(view.height * view.ratio);
  const ctx = canvas.getContext('2d');
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  paint(ctx, boundsOf(view));
  return canvas;
};

// `view`: { width, height, ratio, scale, ox, oy } em pixels de tela.
export const buildWorld = (view) => Object.freeze({
  back: makeLayer(view, (ctx, bounds) => {
    drawSpace(ctx, bounds);
    drawGlassBack(ctx);
  }),
  front: makeLayer(view, (ctx) => drawGlassFront(ctx)),
});

const drawComet = (ctx, bounds, time) => {
  const cycle = Math.floor(time / COMET_EVERY);
  const t = (time - cycle * COMET_EVERY) / COMET_SECONDS;
  if (t >= 1) return;
  const x = bounds.x + (0.1 + noise(cycle, 61) * 0.8) * bounds.w + t * 130;
  const y = bounds.y + noise(cycle, 62) * bounds.h * 0.5 + t * 70;
  const trail = ctx.createLinearGradient(x, y, x - 60, y - 32);
  trail.addColorStop(0, `rgba(255, 255, 255, ${0.9 * Math.sin(t * Math.PI)})`);
  trail.addColorStop(1, 'rgba(160, 200, 255, 0)');
  ctx.strokeStyle = trail;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 60, y - 32);
  ctx.stroke();
};

// Estrelas que piscam e, de vez em quando, uma estrela cadente. `bounds` e a area visivel no espaco de desenho.
export const drawTwinkles = (ctx, bounds, time) => {
  for (let i = 0; i < TWINKLE_COUNT; i += 1) {
    const x = bounds.x + noise(i, 51) * bounds.w;
    const y = bounds.y + noise(i, 52) * bounds.h;
    const glow = 0.5 + 0.5 * Math.sin(time * (0.8 + noise(i, 53) * 2.4) + noise(i, 54) * TAU);
    const size = 0.7 + noise(i, 55) * 1.1;
    ctx.globalAlpha = 0.15 + 0.85 * glow;
    disc(ctx, x, y, size, '#ffffff');
    if (i % 5 === 0) {
      ctx.fillRect(x - size * 3.2 * glow, y - 0.3, size * 6.4 * glow, 0.6);
      ctx.fillRect(x - 0.3, y - size * 3.2 * glow, 0.6, size * 6.4 * glow);
    }
  }
  ctx.globalAlpha = 1;
  drawComet(ctx, bounds, time);
};
