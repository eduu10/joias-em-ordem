// Vida do cenario: o brilho dos cristais pulsando e a poeira subindo devagar.
// Tudo sai do relogio do jogo, sem guardar estado.
import { drawSparkle } from './gem.js';

const TAU = Math.PI * 2;
const MOTES = 34;

const noise = (index, salt) => {
  const value = Math.sin(index * 91.7 + salt * 173.3) * 43758.5453;
  return value - Math.floor(value);
};

const drawGlows = (ctx, glows, time) => {
  ctx.globalCompositeOperation = 'lighter';
  glows.forEach((spot) => {
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.3 + spot.phase);
    const radius = spot.r * (0.8 + pulse * 0.25);
    const glow = ctx.createRadialGradient(spot.gx, spot.gy, 0, spot.gx, spot.gy, radius);
    glow.addColorStop(0, `hsl(${spot.hue} 90% 65% / ${0.1 + pulse * 0.16})`);
    glow.addColorStop(1, `hsl(${spot.hue} 90% 65% / 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(spot.gx - radius, spot.gy - radius, radius * 2, radius * 2);
  });
  ctx.globalCompositeOperation = 'source-over';
  glows.forEach((spot) => {
    const blink = Math.max(0, Math.sin(time * 2.1 + spot.phase * 2.3)) ** 6;
    drawSparkle(ctx, spot.gx + Math.sin(spot.phase) * 9, spot.gy + Math.cos(spot.phase) * 9, 7 * spot.size * blink, blink * 0.9);
  });
};

const drawDust = (ctx, bounds, time) => {
  for (let i = 0; i < MOTES; i += 1) {
    const speed = 5 + noise(i, 1) * 11;
    const travel = bounds.h + 30;
    const y = bounds.y + bounds.h + 15 - ((noise(i, 2) * travel + time * speed) % travel);
    const x = bounds.x + noise(i, 3) * bounds.w + Math.sin(time * (0.3 + noise(i, 4) * 0.5) + i) * 14;
    const twinkle = 0.5 + 0.5 * Math.sin(time * (0.8 + noise(i, 5)) + i * 2.1);
    ctx.fillStyle = `hsl(${185 + noise(i, 6) * 90} 90% 82% / ${0.1 + twinkle * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + noise(i, 7) * 1.4, 0, TAU);
    ctx.fill();
  }
};

export const drawAmbient = (ctx, world, bounds, time) => {
  drawGlows(ctx, world.glows, time);
  drawDust(ctx, bounds, time);
};
