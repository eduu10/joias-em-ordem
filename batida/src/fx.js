// Efeitos visuais (fora da simulacao): faiscas, cacos de vidro, fumaca, poeira, textos flutuantes e marcas de pneu.
// Particulas em metros, no mesmo espaco do mundo. `rand` e um gerador com semente.
import { toScreen } from './camera.js';

const TAU = Math.PI * 2;
const MAX_FX = 260;
const MAX_MARKS = 160;
const GRAVITY = 9.8;

const burst = (rand, count, make) => Array.from({ length: count }, () => make(rand));

export const sparks = (rand, x, y, count = 10, power = 1) => burst(rand, count, (r) => ({
  kind: 'spark', x, y, vx: (r() - 0.3) * 14 * power, vy: -r() * 9 * power, life: 0, max: 0.25 + r() * 0.35, size: 1,
}));

export const glassShards = (rand, x, y, vx) => burst(rand, 26, (r) => ({
  kind: 'glass', x, y, vx: vx * 0.7 + (r() - 0.5) * 8, vy: -r() * 6, life: 0, max: 0.8 + r() * 0.8,
  size: 0.05 + r() * 0.08, spin: r() * TAU,
}));

export const smoke = (rand, x, y, count = 6, dark = false) => burst(rand, count, (r) => ({
  kind: dark ? 'smoke' : 'dust', x: x + (r() - 0.5), y, vx: (r() - 0.5) * 2, vy: -0.8 - r() * 1.5,
  life: 0, max: 1.2 + r() * 1.2, size: 0.4 + r() * 0.5,
}));

export const floatText = (x, y, text, color = '#ffe14a') => ({ kind: 'text', x, y, vx: 0, vy: -1.6, life: 0, max: 1.4, text, color });

export const stepFx = (list, dt) => list
  .map((p) => {
    const g = p.kind === 'spark' || p.kind === 'glass' ? GRAVITY : 0;
    return { ...p, x: p.x + p.vx * dt, y: Math.min(p.kind === 'text' ? p.y + p.vy * dt : -0.02, p.y + p.vy * dt), vy: p.vy + g * dt, life: p.life + dt };
  })
  .filter((p) => p.life < p.max)
  .slice(-MAX_FX);

// Marca de pneu: segmento no chao entre duas posicoes.
export const addMark = (marks, x0, x1, y) => [...marks, { x0, x1, y }].slice(-MAX_MARKS);

export const drawMarks = (ctx, cam, marks) => {
  ctx.strokeStyle = 'rgba(25, 25, 25, 0.45)';
  ctx.lineWidth = Math.max(2, cam.ppm * 0.12);
  ctx.beginPath();
  marks.forEach((m) => {
    const [ax, ay] = toScreen(cam, m.x0, m.y);
    const [bx] = toScreen(cam, m.x1, m.y);
    ctx.moveTo(ax, ay + 2);
    ctx.lineTo(bx, ay + 2);
  });
  ctx.stroke();
};

export const drawFx = (ctx, cam, list) => {
  list.forEach((p) => {
    const t = p.life / p.max;
    const [x, y] = toScreen(cam, p.x, p.y);
    if (p.kind === 'spark') {
      ctx.strokeStyle = `rgba(255, ${200 - t * 120}, 60, ${1 - t})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - p.vx * cam.ppm * 0.02, y - p.vy * cam.ppm * 0.02);
      ctx.stroke();
    } else if (p.kind === 'glass') {
      const s = p.size * cam.ppm;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.spin + p.life * 9);
      ctx.fillStyle = `rgba(200, 240, 255, ${0.9 - t * 0.6})`;
      ctx.fillRect(-s / 2, -s / 2, s, s * 0.6);
      ctx.restore();
    } else if (p.kind === 'smoke' || p.kind === 'dust') {
      const r = p.size * cam.ppm * (1 + t * 2);
      ctx.fillStyle = p.kind === 'smoke' ? `rgba(70, 70, 75, ${0.45 * (1 - t)})` : `rgba(205, 180, 140, ${0.5 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    } else if (p.kind === 'text') {
      const size = Math.max(16, cam.ppm * 0.7) * (1 + 0.4 * Math.max(0, 1 - t * 6));
      ctx.font = `900 ${Math.round(size)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.min(1, (1 - t) * 3);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(30, 10, 0, 0.8)';
      ctx.strokeText(p.text, x, y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, x, y);
      ctx.globalAlpha = 1;
    }
  });
};
