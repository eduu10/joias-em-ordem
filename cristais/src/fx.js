// Efeitos visuais: cristais quebrando, estilhacos, faixas de luz e textos que sobem.
// So enfeite, entao usa Math.random. Cada item pode ter `delay` para entrar em cena depois.
import { BOARD, FEEL } from './config.js';
import { drawText, hsl } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { drawGem, drawSparkle } from './gem.js';

const TAU = Math.PI * 2;
const GRAVITY = 420;
const between = (min, max) => min + Math.random() * (max - min);
const base = { vx: 0, vy: 0, life: 0, delay: 0 };

// Estilhacos triangulares que voam do centro de um cristal quebrado.
export const shards = (x, y, color, count, delay = 0, power = 1) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(50, 170) * power;
    return {
      ...base, kind: 'shard', x: x + between(-8, 8), y: y + between(-8, 8), delay,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 70,
      size: between(2.5, 5.5), spin: between(-9, 9), angle, max: between(0.45, 0.8),
      color: hsl(color, between(-6, 26)),
    };
  });

// Cristal que pisca, encolhe e some.
export const dyingTile = (col, row, color, delay) => ({
  ...base, kind: 'tile', x: BOARD.x + col * BOARD.cell, y: BOARD.y + row * BOARD.cell, delay, max: FEEL.tileSeconds, color,
});

// Faixa de luz que varre a linha ou coluna quebrada.
export const beam = (x, y, w, h, color) => ({ ...base, kind: 'beam', x, y, w, h, max: 0.42, color });

export const ring = (x, y, color, delay = 0) => ({ ...base, kind: 'ring', x, y, delay, size: 46, max: 0.45, color: hsl(color, 14) });

export const floatText = (x, y, text, options = {}) => ({
  ...base, kind: 'text', x, y, vy: -30, text,
  size: options.size ?? 16, color: options.color ?? '#ffffff', delay: options.delay ?? 0, max: options.max ?? 1.1,
});

export const stepFx = (items, dt) =>
  items
    .map((item) => {
      if (item.delay > 0) return { ...item, delay: item.delay - dt };
      const falling = item.kind === 'shard';
      return {
        ...item,
        x: item.x + item.vx * dt,
        y: item.y + item.vy * dt,
        vy: falling ? item.vy + GRAVITY * dt : item.vy * (1 - Math.min(1, dt * 1.6)),
        angle: falling ? item.angle + item.spin * dt : item.angle,
        life: item.life + dt,
      };
    })
    .filter((item) => item.life < item.max);

const drawShard = (ctx, item, t) => {
  const size = item.size * (1 - t * 0.5);
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.angle);
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.moveTo(-size, size * 0.7);
  ctx.lineTo(size * 0.2, -size);
  ctx.lineTo(size, size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, size * 0.2);
  ctx.lineTo(size * 0.2, -size);
  ctx.lineTo(size * 0.25, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawTile = (ctx, item, t) => {
  const grow = t < 0.3 ? 1 + 0.16 * easeOutCubic(t / 0.3) : 1.16 * (1 - easeOutCubic((t - 0.3) / 0.7));
  ctx.globalAlpha = 1;
  drawGem(ctx, item.x, item.y, BOARD.cell, item.color, { scale: grow, flash: Math.min(1, t * 3.2), glow: 0.9 });
  drawSparkle(ctx, item.x + BOARD.cell / 2, item.y + BOARD.cell / 2, BOARD.cell * 0.7 * Math.sin(Math.PI * t), 0.9 * (1 - t));
};

const drawBeam = (ctx, item, t) => {
  const grow = easeOutCubic(clamp01(t / 0.35));
  const horizontal = item.w > item.h;
  const thick = (horizontal ? item.h : item.w) * 0.42 * (1 - t);
  const fill = horizontal
    ? ctx.createLinearGradient(item.x, 0, item.x + item.w, 0)
    : ctx.createLinearGradient(0, item.y, 0, item.y + item.h);
  fill.addColorStop(0, hsl(item.color, 20, 0));
  fill.addColorStop(0.5, `rgba(255, 255, 255, ${0.6 * (1 - t)})`);
  fill.addColorStop(1, hsl(item.color, 20, 0));
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = fill;
  if (horizontal) ctx.fillRect(item.x + (item.w * (1 - grow)) / 2, item.y + (item.h - thick) / 2, item.w * grow, thick);
  else ctx.fillRect(item.x + (item.w - thick) / 2, item.y + (item.h * (1 - grow)) / 2, thick, item.h * grow);
  ctx.globalCompositeOperation = 'source-over';
};

const drawFloat = (ctx, item, t) => {
  const pop = 0.5 + 0.5 * easeOutBack(clamp01(item.life / 0.2));
  ctx.globalAlpha = clamp01((1 - t) * 3);
  drawText(ctx, item.text, item.x, item.y, item.size * pop, { color: item.color, weight: 900 });
};

export const drawFx = (ctx, items) => {
  items.forEach((item) => {
    if (item.delay > 0) {
      // Enquanto a onda nao chega, o cristal continua inteiro no lugar.
      if (item.kind === 'tile') drawGem(ctx, item.x, item.y, BOARD.cell, item.color);
      return;
    }
    const t = item.life / item.max;
    ctx.globalAlpha = Math.min(1, (1 - t) * 2);
    if (item.kind === 'shard') drawShard(ctx, item, t);
    else if (item.kind === 'tile') drawTile(ctx, item, t);
    else if (item.kind === 'beam') drawBeam(ctx, item, t);
    else if (item.kind === 'text') drawFloat(ctx, item, t);
    else {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 5 * (1 - t);
      ctx.beginPath();
      ctx.arc(item.x, item.y, 10 + item.size * easeOutCubic(t), 0, TAU);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
};
