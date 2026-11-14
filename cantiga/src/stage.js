// Cenario de festa: ceu do entardecer, estrelas, bandeirinhas, lampadas e o tablado de madeira. So desenha.
import { DESIGN } from './config.js';

const TAU = Math.PI * 2;
const FLAG_COLORS = Object.freeze(['#ff5a5f', '#ffc93c', '#3ec300', '#2e9bff', '#ff7fd1', '#ff8c2e', '#a46bff']);
const FLOOR_Y = 404;

// Estrelas fixas (mesma posicao sempre): sequencia deterministica simples.
const STARS = Object.freeze(Array.from({ length: 46 }, (_, i) => Object.freeze({
  x: ((i * 7919) % 400) - 20,
  y: ((i * 3571) % 300) - 60,
  r: 0.6 + ((i * 13) % 10) / 10,
  phase: (i * 1.7) % TAU,
})));

const sag = (x0, x1, y0, depth, t) => y0 + depth * 4 * t * (1 - t);

export const drawSky = (ctx, bounds, time) => {
  const sky = ctx.createLinearGradient(0, bounds.y, 0, FLOOR_Y);
  sky.addColorStop(0, '#170a33');
  sky.addColorStop(0.5, '#4b1a5e');
  sky.addColorStop(0.85, '#b4466a');
  sky.addColorStop(1, '#f08a4b');
  ctx.fillStyle = sky;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, FLOOR_Y - bounds.y);
  STARS.forEach((star) => {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 1.6 + star.phase);
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(star.x, star.y + 30, star.r, 0, TAU);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Morros ao longe.
  ctx.fillStyle = '#5e2350';
  ctx.beginPath();
  ctx.moveTo(bounds.x, FLOOR_Y);
  for (let x = bounds.x; x <= bounds.x + bounds.w + 20; x += 20) ctx.lineTo(x, FLOOR_Y - 26 - 14 * Math.sin(x / 47) - 8 * Math.sin(x / 19));
  ctx.lineTo(bounds.x + bounds.w, FLOOR_Y);
  ctx.fill();
};

export const drawFloor = (ctx, bounds) => {
  const floor = ctx.createLinearGradient(0, FLOOR_Y, 0, bounds.y + bounds.h);
  floor.addColorStop(0, '#a55a2a');
  floor.addColorStop(1, '#5b2a14');
  ctx.fillStyle = floor;
  ctx.fillRect(bounds.x, FLOOR_Y, bounds.w, bounds.y + bounds.h - FLOOR_Y);
  ctx.strokeStyle = 'rgba(60, 20, 5, 0.35)';
  ctx.lineWidth = 1;
  for (let y = FLOOR_Y + 14, gap = 14; y < bounds.y + bounds.h; gap *= 1.18, y += gap) {
    ctx.beginPath();
    ctx.moveTo(bounds.x, y);
    ctx.lineTo(bounds.x + bounds.w, y);
    ctx.stroke();
  }
  // Brilho quente da fogueira no centro do tablado.
  const glow = ctx.createRadialGradient(DESIGN.w / 2, FLOOR_Y, 10, DESIGN.w / 2, FLOOR_Y, 260);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.35)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(bounds.x, FLOOR_Y - 262, bounds.w, 524);
};

// Um varal de bandeirinhas entre dois pontos, balancando com o vento.
const drawBunting = (ctx, x0, x1, y0, depth, count, time, offset) => {
  ctx.strokeStyle = 'rgba(255, 240, 210, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const x = x0 + (x1 - x0) * t;
    const y = sag(x0, x1, y0, depth, t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t;
    const y = sag(x0, x1, y0, depth, t);
    const sway = Math.sin(time * 2.2 + i * 0.8 + offset) * 3;
    const color = FLAG_COLORS[(i + offset) % FLAG_COLORS.length];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + sway, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x - 2 + sway * 0.3, y + 6, 1.6, 0, TAU);
    ctx.arc(x + 3 + sway * 0.5, y + 10, 1.2, 0, TAU);
    ctx.fill();
  }
};

// Lampadas acesas num fio, cada uma piscando no seu ritmo.
const drawLights = (ctx, x0, x1, y0, depth, count, time, energy) => {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t;
    const y = sag(x0, x1, y0, depth, t) + 4;
    const on = 0.65 + 0.35 * Math.sin(time * 3 + i * 2.3) + energy * 0.4;
    const hue = [44, 20, 330, 190][i % 4];
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
    glow.addColorStop(0, `hsla(${hue}, 100%, 75%, ${0.55 * on})`);
    glow.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - 14, y - 14, 28, 28);
    ctx.fillStyle = `hsl(${hue} 100% ${70 + 15 * on}%)`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, TAU);
    ctx.fill();
  }
};

export const drawDecor = (ctx, bounds, time, energy = 0) => {
  const left = bounds.x - 10;
  const right = bounds.x + bounds.w + 10;
  drawBunting(ctx, left, right, 6, 34, 14, time, 0);
  drawLights(ctx, left, right, 52, 22, 12, time, energy);
  drawBunting(ctx, left, right, 96, 20, 11, time * 0.9, 3);
};
