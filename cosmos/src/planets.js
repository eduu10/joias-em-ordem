// Desenho dos corpos rochosos e dos planetas (niveis 0 a 6). Cada funcao desenha um corpo de raio `r` em (0, 0).
import { hsl } from './draw.js';
import { TAU, ball, bands, blob, clipDisc, crater, disc, face, noise } from './paint.js';

const ROCK = [28, 32, 48];
const MOON = [48, 26, 80];
const RUST = [14, 72, 54];
const SEA = [205, 82, 52];
const LAND = [128, 52, 46];
const SAND = [42, 78, 64];
const AMBER = [26, 88, 60];
const FROST = [182, 62, 62];

const within = (ctx, r, paint) => {
  ctx.save();
  clipDisc(ctx, r);
  paint();
  ctx.restore();
};

export const drawMeteor = (ctx, r) => {
  ball(ctx, r, ROCK);
  within(ctx, r, () => {
    blob(ctx, r * 0.5, r * 0.55, r * 0.6, r * 0.4, 0.5, hsl(ROCK, -9));
    blob(ctx, -r * 0.6, -r * 0.55, r * 0.5, r * 0.3, -0.6, hsl(ROCK, 9));
    crater(ctx, -r * 0.5, r * 0.5, r * 0.2, ROCK);
    crater(ctx, r * 0.55, -r * 0.5, r * 0.16, ROCK);
    crater(ctx, r * 0.62, r * 0.42, r * 0.11, ROCK);
  });
  face(ctx, r, { ink: '#2b1608', blush: 'rgba(255, 140, 90, 0.45)', scale: 1.15, y: -0.08 });
};

export const drawMoon = (ctx, r) => {
  ball(ctx, r, MOON);
  within(ctx, r, () => {
    blob(ctx, -r * 0.45, -r * 0.5, r * 0.42, r * 0.3, 0.4, hsl(MOON, -10, 0.7));
    blob(ctx, r * 0.5, r * 0.55, r * 0.5, r * 0.3, -0.3, hsl(MOON, -8, 0.7));
    crater(ctx, r * 0.55, -r * 0.45, r * 0.2, MOON);
    crater(ctx, -r * 0.62, r * 0.4, r * 0.15, MOON);
    crater(ctx, r * 0.1, r * 0.68, r * 0.12, MOON);
    crater(ctx, -r * 0.1, -r * 0.72, r * 0.1, MOON);
  });
  face(ctx, r, { ink: '#4a4066', mood: 'sleepy', y: -0.02 });
};

export const drawRocky = (ctx, r) => {
  ball(ctx, r, RUST);
  within(ctx, r, () => {
    blob(ctx, -r * 0.5, r * 0.45, r * 0.55, r * 0.28, 0.5, hsl(RUST, -13));
    blob(ctx, r * 0.55, -r * 0.3, r * 0.4, r * 0.22, -0.5, hsl(RUST, -11));
    blob(ctx, r * 0.4, r * 0.62, r * 0.3, r * 0.14, 0.2, hsl(RUST, 10));
    blob(ctx, 0, -r * 0.98, r * 0.6, r * 0.24, 0, 'rgba(255, 244, 235, 0.92)');
    blob(ctx, 0, r * 1.02, r * 0.45, r * 0.16, 0, 'rgba(255, 244, 235, 0.8)');
    crater(ctx, -r * 0.6, -r * 0.35, r * 0.12, RUST);
  });
  face(ctx, r, { ink: '#3d0f0a', blush: 'rgba(255, 200, 120, 0.5)', y: 0.02 });
};

export const drawOcean = (ctx, r) => {
  ball(ctx, r, SEA);
  within(ctx, r, () => {
    blob(ctx, -r * 0.55, -r * 0.4, r * 0.42, r * 0.3, 0.7, hsl(LAND));
    blob(ctx, -r * 0.72, -r * 0.05, r * 0.24, r * 0.3, 0.2, hsl(LAND, 6));
    blob(ctx, r * 0.6, r * 0.45, r * 0.4, r * 0.26, -0.6, hsl(LAND));
    blob(ctx, r * 0.3, r * 0.75, r * 0.3, r * 0.16, 0.3, hsl(LAND, -6));
    blob(ctx, r * 0.55, -r * 0.62, r * 0.22, r * 0.12, -0.3, hsl(LAND, 8));
    blob(ctx, r * 0.35, -r * 0.42, r * 0.4, r * 0.08, -0.15, 'rgba(255, 255, 255, 0.75)');
    blob(ctx, -r * 0.3, r * 0.55, r * 0.38, r * 0.07, 0.12, 'rgba(255, 255, 255, 0.7)');
    blob(ctx, -r * 0.1, -r * 0.8, r * 0.3, r * 0.07, 0.05, 'rgba(255, 255, 255, 0.65)');
  });
  face(ctx, r, { ink: '#0b2350', y: 0.02 });
};

const ringHalf = (ctx, r, from, to) => {
  [[0.2, hsl([36, 70, 58], 0, 0.95)], [0.11, hsl([44, 90, 82], 0, 0.95)], [0.03, hsl([30, 60, 42], 0, 0.8)]].forEach(([width, color]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = r * width;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.12, r * 1.16, r * 0.3, -0.3, from, to);
    ctx.stroke();
  });
};

export const drawRinged = (ctx, r) => {
  ringHalf(ctx, r, Math.PI, TAU);
  ball(ctx, r * 0.9, SAND);
  within(ctx, r * 0.9, () => {
    bands(ctx, r, [
      [-0.72, 0.16, hsl(SAND, -10, 0.8)], [-0.42, 0.1, hsl(SAND, 12, 0.8)],
      [0.36, 0.14, hsl(SAND, -12, 0.8)], [0.62, 0.12, hsl(SAND, 10, 0.7)],
    ]);
  });
  face(ctx, r, { ink: '#4a2a08', y: -0.2, scale: 0.9 });
  ringHalf(ctx, r, 0, Math.PI);
};

export const drawGasGiant = (ctx, r) => {
  ball(ctx, r, AMBER);
  within(ctx, r, () => {
    bands(ctx, r, [
      [-0.86, 0.2, hsl([18, 70, 42], 0, 0.85)], [-0.58, 0.14, hsl([40, 95, 82], 0, 0.9)],
      [-0.36, 0.1, hsl([14, 80, 48], 0, 0.8)], [0.3, 0.16, hsl([44, 95, 84], 0, 0.9)],
      [0.52, 0.14, hsl([16, 75, 44], 0, 0.85)], [0.76, 0.2, hsl([34, 85, 70], 0, 0.8)],
    ]);
    blob(ctx, r * 0.5, r * 0.4, r * 0.24, r * 0.14, -0.1, hsl([4, 85, 48]));
    blob(ctx, r * 0.47, r * 0.38, r * 0.1, r * 0.045, -0.1, hsl([10, 90, 58]));
  });
  face(ctx, r, { ink: '#4a1a05', y: -0.05, scale: 0.85 });
};

const sparkle = (ctx, x, y, size) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x, y, x + size, y);
  ctx.quadraticCurveTo(x, y, x, y + size);
  ctx.quadraticCurveTo(x, y, x - size, y);
  ctx.quadraticCurveTo(x, y, x, y - size);
  ctx.fill();
};

export const drawIceGiant = (ctx, r) => {
  ball(ctx, r, FROST);
  within(ctx, r, () => {
    bands(ctx, r, [
      [-0.8, 0.18, hsl([195, 80, 82], 0, 0.6)], [-0.5, 0.1, hsl([170, 60, 48], 0, 0.5)],
      [0.32, 0.12, hsl([200, 85, 84], 0, 0.6)], [0.58, 0.2, hsl([190, 60, 46], 0, 0.5)],
    ]);
    blob(ctx, 0, -r, r * 0.7, r * 0.22, 0, 'rgba(255, 255, 255, 0.8)');
    for (let i = 0; i < 7; i += 1) {
      const angle = noise(i, 3) * TAU;
      const reach = (0.45 + noise(i, 4) * 0.4) * r;
      sparkle(ctx, Math.cos(angle) * reach, Math.sin(angle) * reach, r * (0.05 + noise(i, 5) * 0.05));
    }
  });
  face(ctx, r, { ink: '#0c3a4a', blush: 'rgba(255, 150, 200, 0.45)', y: -0.02, scale: 0.8 });
};
