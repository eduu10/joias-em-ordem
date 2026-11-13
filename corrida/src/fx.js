// Efeitos visuais na tela: faiscas, aneis, poeira e textos que sobem. So enfeite, entao usa Math.random.
import { drawText } from './draw.js';

const TAU = Math.PI * 2;
const GRAVITY = 300;
const between = (min, max) => min + Math.random() * (max - min);

export const sparks = (x, y, hue, count, power = 1) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(40, 150) * power;
    return {
      kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 50 * power,
      size: between(1.6, 3.6) * power, life: 0, max: between(0.3, 0.65), color: `hsl(${hue} 95% ${between(62, 86)}%)`,
    };
  });

export const ring = (x, y, color, size = 46) => ({
  kind: 'ring', x, y, vx: 0, vy: 0, size, life: 0, max: 0.45, color,
});

// Poeira ao pousar ou deslizar: bolinhas claras que crescem e somem.
export const dust = (x, y, count = 4) =>
  Array.from({ length: count }, () => ({
    kind: 'dust', x: x + between(-12, 12), y, vx: between(-40, 40), vy: between(-26, -6),
    size: between(4, 8), life: 0, max: between(0.25, 0.45), color: 'rgba(236, 232, 255, 0.55)',
  }));

export const floatText = (x, y, text, color = '#ffe066', size = 15) => ({
  kind: 'text', x, y, vx: 0, vy: -38, size, life: 0, max: 1, color, text,
});

export const stepFx = (items, dt) =>
  items
    .map((item) => ({
      ...item,
      x: item.x + item.vx * dt,
      y: item.y + item.vy * dt,
      vy: item.kind === 'spark' ? item.vy + GRAVITY * dt : item.vy,
      life: item.life + dt,
    }))
    .filter((item) => item.life < item.max);

export const drawFx = (ctx, items) => {
  items.forEach((item) => {
    const t = item.life / item.max;
    ctx.globalAlpha = Math.min(1, (1 - t) * 1.8);
    if (item.kind === 'spark') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size * (1 - t * 0.6), 0, TAU);
      ctx.fill();
    } else if (item.kind === 'dust') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size * (0.6 + t), 0, TAU);
      ctx.fill();
    } else if (item.kind === 'ring') {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 5 * (1 - t);
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8 + item.size * t, 0, TAU);
      ctx.stroke();
    } else {
      drawText(ctx, item.text, item.x, item.y, item.size, { color: item.color });
    }
  });
  ctx.globalAlpha = 1;
};
