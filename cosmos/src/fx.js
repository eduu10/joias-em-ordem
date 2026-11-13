// Efeitos visuais: faiscas, aneis e clarao de fusao, textos que sobem. So enfeite, entao usa Math.random.
import { drawText, hsl } from './draw.js';

const TAU = Math.PI * 2;
const SPARK_GRAVITY = 220;
const between = (min, max) => min + Math.random() * (max - min);

// `color`: [h, s, l]
export const sparks = (x, y, color, count, power = 1) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(40, 150) * power;
    return {
      kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30,
      size: between(1.2, 3) * Math.sqrt(power), life: 0, max: between(0.35, 0.75), color: hsl(color, between(-4, 18)),
    };
  });

export const ring = (x, y, radius, color, delay = 0) => ({
  kind: 'ring', x, y, vx: 0, vy: 0, size: radius, life: -delay, max: 0.5, color: hsl(color, 10),
});

export const flash = (x, y, radius) => ({
  kind: 'flash', x, y, vx: 0, vy: 0, size: radius, life: 0, max: 0.22, color: '#ffffff',
});

export const floatText = (x, y, text, size = 15, color = '#fff3b0') => ({
  kind: 'text', x, y, vx: 0, vy: -38, size, life: 0, max: 1, color, text,
});

export const stepFx = (items, dt) =>
  items
    .map((item) => ({
      ...item,
      x: item.x + item.vx * dt,
      y: item.y + item.vy * dt,
      vx: item.kind === 'spark' ? item.vx * (1 - 1.5 * dt) : item.vx,
      vy: item.kind === 'spark' ? item.vy + SPARK_GRAVITY * dt : item.vy * (1 - 1.2 * dt),
      life: item.life + dt,
    }))
    .filter((item) => item.life < item.max);

const drawSpark = (ctx, item, t) => {
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.size * (1 - t * 0.7), 0, TAU);
  ctx.fill();
};

const drawRing = (ctx, item, t) => {
  const grow = 1 - (1 - t) ** 3;
  ctx.strokeStyle = item.color;
  ctx.lineWidth = Math.max(0.5, item.size * 0.16 * (1 - t));
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.size * (0.6 + grow * 0.9), 0, TAU);
  ctx.stroke();
};

const drawFlash = (ctx, item, t) => {
  const radius = item.size * (0.8 + t * 0.7);
  const glow = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, radius);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glow.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y, radius, 0, TAU);
  ctx.fill();
};

export const drawFx = (ctx, items) => {
  ctx.save();
  items.forEach((item) => {
    if (item.life < 0) return;
    const t = item.life / item.max;
    ctx.globalAlpha = Math.min(1, (1 - t) * 1.8);
    ctx.globalCompositeOperation = item.kind === 'text' ? 'source-over' : 'lighter';
    if (item.kind === 'spark') drawSpark(ctx, item, t);
    else if (item.kind === 'ring') drawRing(ctx, item, t);
    else if (item.kind === 'flash') drawFlash(ctx, item, t);
    else drawText(ctx, item.text, item.x, item.y, item.size * (1 + 0.5 * Math.max(0, 1 - t * 6)), { color: item.color });
  });
  ctx.restore();
};
