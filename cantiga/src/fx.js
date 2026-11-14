// Efeitos visuais: confete, faiscas e textos que sobem. So enfeite, entao usa Math.random.
import { drawText } from './draw.js';

const TAU = Math.PI * 2;
const CONFETTI_HUES = Object.freeze([48, 176, 322, 276, 138, 14]);
const between = (min, max) => min + Math.random() * (max - min);

export const sparks = (x, y, hue, count, power = 1) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(40, 150) * power;
    return {
      kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, spin: 0, turn: 0,
      size: between(1.6, 3.6) * power, life: 0, max: between(0.35, 0.7), color: `hsl(${hue} 95% ${between(62, 84)}%)`,
    };
  });

// Chuva de confete saindo de cima, para a vitoria.
export const confetti = (count, width) =>
  Array.from({ length: count }, (_, index) => ({
    kind: 'confetti', x: between(0, width), y: between(-140, -10), vx: between(-30, 30), vy: between(60, 150),
    spin: between(0, TAU), turn: between(-7, 7), size: between(5, 9), life: 0, max: between(2.2, 3.6),
    color: `hsl(${CONFETTI_HUES[index % CONFETTI_HUES.length]} 92% 64%)`,
  }));

export const floatText = (x, y, text, color = '#ffe066', size = 20) => ({
  kind: 'text', x, y, vx: 0, vy: -38, spin: 0, turn: 0, size, life: 0, max: 1.1, color, text,
});

export const stepFx = (items, dt) =>
  items
    .map((item) => ({
      ...item,
      x: item.x + item.vx * dt,
      y: item.y + item.vy * dt,
      vy: item.kind === 'spark' ? item.vy + 300 * dt : item.vy,
      spin: item.spin + item.turn * dt,
      life: item.life + dt,
    }))
    .filter((item) => item.life < item.max);

export const drawFx = (ctx, items) => {
  items.forEach((item) => {
    const t = item.life / item.max;
    ctx.globalAlpha = Math.min(1, (1 - t) * 2.2);
    if (item.kind === 'spark') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size * (1 - t * 0.6), 0, TAU);
      ctx.fill();
    } else if (item.kind === 'confetti') {
      ctx.save();
      ctx.translate(item.x + Math.sin(item.life * 3 + item.spin) * 8, item.y);
      ctx.rotate(item.spin);
      ctx.scale(1, Math.cos(item.spin * 1.7));
      ctx.fillStyle = item.color;
      ctx.fillRect(-item.size / 2, -item.size / 3, item.size, item.size / 1.5);
      ctx.restore();
    } else {
      drawText(ctx, item.text, item.x, item.y, item.size * (1 + Math.max(0, 0.2 - t) * 2), { color: item.color });
    }
  });
  ctx.globalAlpha = 1;
};
