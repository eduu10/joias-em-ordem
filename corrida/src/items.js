// Coisas de pegar: moedas girando e os poderes (ima e escudo). Os icones tambem sao usados na interface.
import { ITEM } from './config.js';
import { laneX, project } from './camera.js';

const TAU = Math.PI * 2;
const COIN_RADIUS = 0.27;
const POWER_RADIUS = 0.44;

// `spin` de -1 a 1: a largura da moeda acompanha o giro.
export const drawCoin = (ctx, x, y, radius, spin = 1) => {
  const width = radius * Math.max(0.14, Math.abs(spin));
  ctx.fillStyle = '#b86a10';
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.1, y + radius * 0.1, width, radius, 0, 0, TAU);
  ctx.fill();
  const face = ctx.createLinearGradient(0, y - radius, 0, y + radius);
  face.addColorStop(0, '#fff1a6');
  face.addColorStop(1, '#ffb52e');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(x, y, width, radius, 0, 0, TAU);
  ctx.fill();
  if (width > radius * 0.45 && radius > 3) {
    ctx.strokeStyle = 'rgba(170, 96, 0, 0.6)';
    ctx.lineWidth = Math.max(0.8, radius * 0.14);
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.62, radius * 0.62, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(x - width * 0.36, y - radius * 0.42, width * 0.24, radius * 0.13, -0.6, 0, TAU);
    ctx.fill();
  }
};

export const drawMagnetIcon = (ctx, x, y, size) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.lineCap = 'butt';
  ctx.lineWidth = size * 0.42;
  ctx.strokeStyle = '#ff4d5e';
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.55);
  ctx.lineTo(-size * 0.5, size * 0.1);
  ctx.arc(0, size * 0.1, size * 0.5, Math.PI, 0, true);
  ctx.lineTo(size * 0.5, -size * 0.55);
  ctx.stroke();
  ctx.strokeStyle = '#f4f7ff';
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.75);
  ctx.lineTo(-size * 0.5, -size * 0.38);
  ctx.moveTo(size * 0.5, -size * 0.75);
  ctx.lineTo(size * 0.5, -size * 0.38);
  ctx.stroke();
  ctx.restore();
};

export const drawShieldIcon = (ctx, x, y, size) => {
  const fill = ctx.createLinearGradient(0, y - size, 0, y + size);
  fill.addColorStop(0, '#9be8ff');
  fill.addColorStop(1, '#2f8fff');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.72, x + size * 0.86, y - size * 0.7);
  ctx.quadraticCurveTo(x + size * 0.92, y + size * 0.45, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.92, y + size * 0.45, x - size * 0.86, y - size * 0.7);
  ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.72, x, y - size);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(1, size * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.34, y);
  ctx.lineTo(x - size * 0.06, y + size * 0.28);
  ctx.lineTo(x + size * 0.38, y - size * 0.26);
  ctx.stroke();
};

const POWER_HUE = Object.freeze({ [ITEM.MAGNET]: 345, [ITEM.SHIELD]: 200 });

const drawPower = (ctx, item, view) => {
  const bob = Math.sin(view.time * 3.2 + item.z) * 0.08;
  const ground = project(laneX(item.lane), 0, item.zRel, view.camX);
  const point = project(laneX(item.lane), item.h + bob, item.zRel, view.camX);
  const radius = POWER_RADIUS * point.scale;
  const hue = POWER_HUE[item.type];
  ctx.fillStyle = 'rgba(10, 4, 40, 0.28)';
  ctx.beginPath();
  ctx.ellipse(ground.x, ground.y, radius * 0.8, radius * 0.22, 0, 0, TAU);
  ctx.fill();

  const pulse = 0.5 + 0.5 * Math.sin(view.time * 5);
  const glow = ctx.createRadialGradient(point.x, point.y, radius * 0.3, point.x, point.y, radius * (2 + pulse * 0.4));
  glow.addColorStop(0, `hsl(${hue} 100% 80% / 0.55)`);
  glow.addColorStop(1, `hsl(${hue} 100% 70% / 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 2.4, 0, TAU);
  ctx.fill();

  const body = ctx.createRadialGradient(point.x - radius * 0.3, point.y - radius * 0.4, radius * 0.1, point.x, point.y, radius);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(1, `hsl(${hue} 70% 92%)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `hsl(${hue} 90% 62%)`;
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.stroke();
  if (item.type === ITEM.MAGNET) drawMagnetIcon(ctx, point.x, point.y + radius * 0.08, radius * 0.56);
  else drawShieldIcon(ctx, point.x, point.y, radius * 0.6);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} item item da simulacao, com `zRel` (metros a frente do robo)
 * @param {{camX: number, time: number}} view
 */
export const drawItem = (ctx, item, view) => {
  if (item.type !== ITEM.COIN) return drawPower(ctx, item, view);
  const point = project(laneX(item.lane), item.h, item.zRel, view.camX);
  const radius = COIN_RADIUS * point.scale;
  if (radius > 2.5) {
    ctx.fillStyle = 'rgba(255, 226, 120, 0.2)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 1.7, 0, TAU);
    ctx.fill();
  }
  return drawCoin(ctx, point.x, point.y, radius, Math.cos(view.time * 5 + item.z * 0.8));
};
