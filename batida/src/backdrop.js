// Cenario: ceu, morros, arvores, pista pintada com marcas de distancia, barreiras e obstaculos. So desenha.
import { toScreen } from './camera.js';

const TAU = Math.PI * 2;

const drawSky = (ctx, cam, time) => {
  const g = ctx.createLinearGradient(0, 0, 0, cam.h);
  g.addColorStop(0, '#3d8fe0');
  g.addColorStop(0.55, '#8fd0f5');
  g.addColorStop(1, '#e3f4ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cam.w, cam.h);
  const sx = cam.w * 0.82;
  const sy = cam.h * 0.14;
  const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, cam.h * 0.25);
  glow.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
  glow.addColorStop(0.15, 'rgba(255, 240, 180, 0.55)');
  glow.addColorStop(1, 'rgba(255, 240, 180, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, cam.w, cam.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 5; i += 1) {
    const x = (((i * 260 + time * 6 - cam.x * cam.ppm * 0.03) % (cam.w + 300)) + cam.w + 300) % (cam.w + 300) - 150;
    const y = cam.h * (0.08 + (i % 3) * 0.07);
    [[0, 0, 26], [22, 6, 20], [-22, 7, 18], [44, 10, 14]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, TAU);
      ctx.fill();
    });
  }
};

// Silhueta de morros com paralaxe: `depth` 0 = infinito, 1 = junto da pista.
const drawHills = (ctx, cam, depth, color, height, seed) => {
  const horizon = toScreen(cam, 0, 0)[1] * depth + cam.h * 0.55 * (1 - depth);
  const offset = cam.x * cam.ppm * depth * 0.25;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, cam.h);
  for (let x = 0; x <= cam.w + 20; x += 20) {
    const u = (x + offset) / 140;
    const y = horizon - height * (0.6 + 0.25 * Math.sin(u + seed) + 0.15 * Math.sin(u * 2.3 + seed * 2));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cam.w, cam.h);
  ctx.closePath();
  ctx.fill();
  return horizon;
};

const drawTrees = (ctx, cam, horizon) => {
  const depth = 0.55;
  const spacing = 120;
  const offset = cam.x * cam.ppm * depth * 0.5;
  const start = Math.floor(offset / spacing) - 1;
  for (let i = start; i < start + cam.w / spacing + 3; i += 1) {
    const x = i * spacing - offset + ((i * 37) % 50);
    const size = 18 + ((i * 53) % 14);
    ctx.fillStyle = '#5b3d22';
    ctx.fillRect(x - 2, horizon - size * 0.6, 4, size * 0.6);
    ctx.fillStyle = i % 2 ? '#2f8a3a' : '#3a9a40';
    ctx.beginPath();
    ctx.arc(x, horizon - size * 0.9, size * 0.55, 0, TAU);
    ctx.arc(x - size * 0.3, horizon - size * 0.65, size * 0.4, 0, TAU);
    ctx.arc(x + size * 0.3, horizon - size * 0.65, size * 0.4, 0, TAU);
    ctx.fill();
  }
};

const drawRunway = (ctx, cam, groundTop, groundEnd) => {
  const [, gy] = toScreen(cam, 0, 0);
  const depthPx = Math.max(28, cam.ppm * 1.4);
  const grass = ctx.createLinearGradient(0, gy, 0, cam.h);
  grass.addColorStop(0, '#6cbf4c');
  grass.addColorStop(1, '#3f8f35');
  ctx.fillStyle = grass;
  ctx.fillRect(0, gy, cam.w, cam.h - gy);
  // Faixas de grama cortada que andam com a camera.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  const band = cam.ppm * 3;
  const shift = ((cam.x * cam.ppm) % (band * 2) + band * 2) % (band * 2);
  for (let x = -shift - cam.h; x < cam.w + cam.h; x += band * 2) {
    ctx.beginPath();
    ctx.moveTo(x, gy + depthPx);
    ctx.lineTo(x + band, gy + depthPx);
    ctx.lineTo(x + band - (cam.h - gy) * 0.6, cam.h);
    ctx.lineTo(x - (cam.h - gy) * 0.6, cam.h);
    ctx.fill();
  }
  ctx.fillStyle = '#4c4f57';
  ctx.fillRect(0, gy, cam.w, depthPx);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(0, gy + 1, cam.w, 2);
  ctx.fillRect(0, gy + depthPx - 3, cam.w, 2);
  // Faixa central tracejada e marcas a cada 10 m.
  const x0 = Math.floor((cam.x - cam.ax / cam.ppm) / 2) * 2;
  for (let x = x0; x < cam.x + cam.w / cam.ppm; x += 2) {
    if (x % 4 !== 0) continue;
    const [sx] = toScreen(cam, x, 0);
    ctx.fillStyle = 'rgba(255, 214, 64, 0.9)';
    ctx.fillRect(sx, gy + depthPx * 0.48, cam.ppm * 1.4, 2);
  }
  ctx.font = `800 ${Math.round(depthPx * 0.36)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let x = Math.floor(x0 / 10) * 10; x < cam.x + cam.w / cam.ppm; x += 10) {
    if (groundTop && x < groundEnd) continue;
    const [sx] = toScreen(cam, x, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(sx - 1, gy + 3, 2, depthPx - 6);
    ctx.fillText(`${Math.abs(x)}`, sx + depthPx * 0.45, gy + depthPx * 0.72);
  }
};

// Guard-rail atras da pista.
const drawBarrier = (ctx, cam, y0, fromX, toX) => {
  const left = Math.max(fromX, cam.x - cam.ax / cam.ppm - 2);
  const right = Math.min(toX, cam.x + cam.w / cam.ppm + 2);
  if (right <= left) return;
  const [ax, ay] = toScreen(cam, left, y0 - 0.75);
  const [bx] = toScreen(cam, right, y0);
  const h = cam.ppm * 0.28;
  ctx.fillStyle = '#7d8590';
  for (let x = Math.ceil(left / 3) * 3; x < right; x += 3) {
    const [px, py] = toScreen(cam, x, y0 - 0.8);
    ctx.fillRect(px - 2, py, 4, cam.ppm * 0.8);
  }
  const g = ctx.createLinearGradient(0, ay, 0, ay + h);
  g.addColorStop(0, '#eef2f6');
  g.addColorStop(1, '#9aa3ad');
  ctx.fillStyle = g;
  ctx.fillRect(ax, ay, bx - ax, h);
  ctx.fillStyle = '#e5322b';
  for (let x = Math.ceil(left / 6) * 6; x < right; x += 6) {
    const [px] = toScreen(cam, x, 0);
    ctx.fillRect(px, ay, cam.ppm * 0.9, h);
  }
};

const polyPath = (ctx, cam, points) => {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    const [sx, sy] = toScreen(cam, x, y);
    if (i) ctx.lineTo(sx, sy);
    else ctx.moveTo(sx, sy);
  });
  ctx.closePath();
};

const STATIC_STYLE = Object.freeze({
  concrete: ['#c9c4bb', '#8f8a82'],
  steel: ['#ffd23f', '#2b2b2b'],
  ramp: ['#e9a23b', '#a7621b'],
  cliff: ['#9b7653', '#6b4e33'],
});

const drawStatic = (ctx, cam, shape, time) => {
  const [light, dark] = STATIC_STYLE[shape.kind] ?? STATIC_STYLE.concrete;
  const [x0, y0] = toScreen(cam, shape.minX, shape.minY);
  const [x1, y1] = toScreen(cam, shape.maxX, shape.maxY);
  if (x1 < -50 || x0 > cam.w + 50) return;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  polyPath(ctx, cam, shape.points);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (shape.kind === 'steel' || shape.kind === 'ramp') {
    // Faixas de alerta originais (amarelo e preto / chevrons).
    ctx.fillStyle = shape.kind === 'steel' ? '#1d1d1d' : 'rgba(255, 255, 255, 0.55)';
    const step = cam.ppm * 0.5;
    for (let s = -cam.h; s < cam.w + cam.h; s += step * 2) {
      ctx.beginPath();
      ctx.moveTo(s, y1);
      ctx.lineTo(s + step, y1);
      ctx.lineTo(s + step + (y1 - y0), y0);
      ctx.lineTo(s + (y1 - y0), y0);
      ctx.fill();
    }
  } else if (shape.kind === 'cliff') {
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x0, y0, x1 - x0, cam.ppm * 0.4);
    ctx.fillStyle = 'rgba(60, 40, 25, 0.35)';
    for (let i = 0; i < 40; i += 1) ctx.fillRect(x1 - ((i * 97) % 600), y0 + ((i * 61) % Math.max(1, y1 - y0)), 18, 6);
  } else {
    ctx.strokeStyle = 'rgba(80, 75, 70, 0.35)';
    ctx.lineWidth = 1;
    for (let y = y0; y < y1; y += cam.ppm * 0.5) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 210, 63, ${0.75 + 0.25 * Math.sin(time * 4)})`;
    ctx.fillRect(x0, y0 + cam.ppm * 0.3, x1 - x0, cam.ppm * 0.18);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.5)';
  ctx.lineWidth = 1.5;
  polyPath(ctx, cam, shape.points);
  ctx.stroke();
};

export const drawBackdrop = (ctx, cam, track, time) => {
  drawSky(ctx, cam, time);
  drawHills(ctx, cam, 0.15, '#9fc7d9', cam.h * 0.18, 1);
  const horizon = drawHills(ctx, cam, 0.35, '#7fb36d', cam.h * 0.12, 4);
  drawTrees(ctx, cam, horizon + 6);
  drawRunway(ctx, cam, track.groundTop, 0);
  drawBarrier(ctx, cam, 0, track.groundTop ? 0 : -200, 500);
  if (track.groundTop) drawBarrier(ctx, cam, track.groundTop, -200, -1);
};

export const drawStatics = (ctx, cam, statics, time) => statics.forEach((shape) => drawStatic(ctx, cam, shape, time));
