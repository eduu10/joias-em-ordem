// Particulas: brilho quando um pote fecha e confete na vitoria. So enfeite, entao usa Math.random.
import { gemColor } from './draw.js';

const GRAVITY = 900;
const CONFETTI_HUES = Object.freeze([350, 46, 142, 212, 274, 322]);
const TAU = Math.PI * 2;

const between = (min, max) => min + Math.random() * (max - min);

export const sparkleBurst = (x, y, color, size, count = 22) =>
  Array.from({ length: count }, () => {
    const angle = between(0, TAU);
    const speed = between(size * 2, size * 7);
    return {
      kind: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - size * 2,
      size: between(size * 0.06, size * 0.16),
      life: 0,
      max: between(0.45, 0.9),
      fill: gemColor(color, between(10, 30)),
      spin: 0,
      angle: 0,
    };
  });

export const confettiRain = (view, count = 110) =>
  Array.from({ length: count }, () => ({
    kind: 'confetti',
    x: between(0, view.width),
    y: between(-view.height * 0.5, -10),
    vx: between(-60, 60),
    vy: between(120, 360),
    size: between(6, 12),
    life: 0,
    max: between(2.2, 3.6),
    fill: `hsl(${CONFETTI_HUES[Math.floor(Math.random() * CONFETTI_HUES.length)]} 92% 64%)`,
    spin: between(-9, 9),
    angle: between(0, TAU),
  }));

export const stepParticles = (particles, dt) =>
  particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + (p.kind === 'spark' ? GRAVITY * 0.6 : GRAVITY * 0.12) * dt,
      angle: p.angle + p.spin * dt,
      life: p.life + dt,
    }))
    .filter((p) => p.life < p.max);

export const drawParticles = (ctx, particles) => {
  particles.forEach((p) => {
    const fade = 1 - p.life / p.max;
    ctx.globalAlpha = Math.min(1, fade * 1.6);
    ctx.fillStyle = p.fill;
    if (p.kind === 'spark') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + fade), 0, TAU);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillRect(-p.size / 2, -p.size * 0.3 * Math.cos(p.angle * 1.7), p.size, p.size * 0.6);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
};
