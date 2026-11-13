// Efeitos visuais: faiscas, aneis de fusao e textos que sobem. So enfeite, entao usa Math.random.
import { drawText } from './draw.js';
import { tierHue } from './actors.js';

const TAU = Math.PI * 2;
const between = (min, max) => min + Math.random() * (max - min);

export const sparks = (x, y, hue, count, power = 1) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(30, 110) * power;
    return {
      kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30,
      size: between(1.4, 3.2) * power, life: 0, max: between(0.3, 0.6), color: `hsl(${hue} 90% ${between(60, 82)}%)`,
    };
  });

export const ring = (x, y, tier) => ({
  kind: 'ring', x, y, vx: 0, vy: 0, size: 44, life: 0, max: 0.5, color: `hsl(${tierHue(tier)} 90% 75%)`,
});

export const floatText = (x, y, text, color = '#ffe066') => ({
  kind: 'text', x, y, vx: 0, vy: -34, size: 13, life: 0, max: 0.9, color, text,
});

export const stepFx = (items, dt) =>
  items
    .map((item) => ({
      ...item,
      x: item.x + item.vx * dt,
      y: item.y + item.vy * dt,
      vy: item.kind === 'spark' ? item.vy + 260 * dt : item.vy,
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
    } else if (item.kind === 'ring') {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 4 * (1 - t);
      ctx.beginPath();
      ctx.arc(item.x, item.y - 14, 8 + item.size * t, 0, TAU);
      ctx.stroke();
    } else {
      drawText(ctx, item.text, item.x, item.y, item.size, { color: item.color });
    }
  });
  ctx.globalAlpha = 1;
};
