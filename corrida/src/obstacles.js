// Obstaculos em perspectiva. Cada tipo tem cor e silhueta proprias para ser lido de longe:
// barreira baixa amarela (pular), viga alta rosa (deslizar), conteiner verde (desviar) e drone com feixe vermelho (desviar).
import { HALF_DEPTH, KIND } from './config.js';
import { EYE_HEIGHT, laneX, project } from './camera.js';

const TAU = Math.PI * 2;
const HALF_WIDTH = 0.52;
const LOW_HEIGHT = 0.55;
const BEAM_BOTTOM = 0.98;
const BEAM_TOP = 1.58;
const BLOCK_HEIGHT = 1.9;
const DRONE_HEIGHT = 1.75;
const FADE_END = 2.8;
const FADE_METERS = 1.6;

const fillPath = (ctx, points, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.closePath();
  ctx.fill();
};

// Caixa em perspectiva: lado visivel, tampa e frente. Devolve o retangulo da frente para os detalhes.
const drawBox = (ctx, box, camX, colors) => {
  const { x0, x1, y0, y1, z0, z1 } = box;
  const at = (x, y, z) => project(x, y, z, camX);
  if (x0 > camX) fillPath(ctx, [at(x0, y0, z0), at(x0, y1, z0), at(x0, y1, z1), at(x0, y0, z1)], colors.side);
  else if (x1 < camX) fillPath(ctx, [at(x1, y0, z0), at(x1, y1, z0), at(x1, y1, z1), at(x1, y0, z1)], colors.side);
  if (y1 < EYE_HEIGHT) fillPath(ctx, [at(x0, y1, z0), at(x1, y1, z0), at(x1, y1, z1), at(x0, y1, z1)], colors.top);
  const a = at(x0, y1, z0);
  const b = at(x1, y0, z0);
  const front = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, scale: a.scale };
  ctx.fillStyle = colors.front(front);
  ctx.fillRect(front.x, front.y, front.w, front.h);
  return front;
};

const vertical = (ctx, rect, top, bottom) => {
  const fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  return fill;
};

const drawGroundShadow = (ctx, x, z, camX, halfWidth, alpha = 0.3) => {
  const point = project(x, 0, z, camX);
  ctx.fillStyle = `rgba(10, 4, 40, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, halfWidth * point.scale, halfWidth * point.scale * 0.2, 0, 0, TAU);
  ctx.fill();
};

const drawLow = (ctx, x, z, view) => {
  drawGroundShadow(ctx, x, z - 0.1, view.camX, HALF_WIDTH * 1.1);
  const front = drawBox(ctx,
    { x0: x - HALF_WIDTH, x1: x + HALF_WIDTH, y0: 0, y1: LOW_HEIGHT, z0: z - HALF_DEPTH.low, z1: z + HALF_DEPTH.low },
    view.camX,
    { side: '#a36a00', top: '#fff0a0', front: (rect) => vertical(ctx, rect, '#ffd83a', '#f2a900') });
  // Listras de perigo.
  ctx.save();
  ctx.beginPath();
  ctx.rect(front.x, front.y + front.h * 0.2, front.w, front.h * 0.6);
  ctx.clip();
  ctx.fillStyle = '#2b2140';
  const stripe = front.w / 5;
  for (let i = -1; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(front.x + i * stripe, front.y + front.h);
    ctx.lineTo(front.x + (i + 0.5) * stripe, front.y + front.h);
    ctx.lineTo(front.x + (i + 1.1) * stripe, front.y);
    ctx.lineTo(front.x + (i + 0.6) * stripe, front.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const blink = 0.5 + 0.5 * Math.sin(view.time * 8);
  ctx.fillStyle = `rgba(255, 250, 200, ${0.5 + blink * 0.5})`;
  const lamp = Math.max(1, front.scale * 0.06);
  ctx.beginPath();
  ctx.arc(front.x + lamp, front.y - lamp * 0.2, lamp, 0, TAU);
  ctx.arc(front.x + front.w - lamp, front.y - lamp * 0.2, lamp, 0, TAU);
  ctx.fill();
};

const drawHigh = (ctx, x, z, view) => {
  const colors = { side: '#7a1f6e', top: '#ff9be6', front: (rect) => vertical(ctx, rect, '#ff5fd2', '#c02aa0') };
  const post = { side: '#4a2a6e', top: '#b9a6e8', front: () => '#8d78c8' };
  const z0 = z - HALF_DEPTH.high;
  const z1 = z + HALF_DEPTH.high;
  [-1, 1].forEach((side) => {
    const center = x + side * (HALF_WIDTH + 0.02);
    drawBox(ctx, { x0: center - 0.05, x1: center + 0.05, y0: 0, y1: BEAM_BOTTOM, z0, z1 }, view.camX, post);
  });
  // Luz por baixo da viga: mostra que o caminho e por ali.
  const under = project(x, BEAM_BOTTOM, z0, view.camX);
  const floor = project(x, 0, z0, view.camX);
  const halfPixels = HALF_WIDTH * under.scale;
  const glow = ctx.createLinearGradient(0, under.y, 0, floor.y);
  glow.addColorStop(0, 'rgba(255, 110, 220, 0.42)');
  glow.addColorStop(1, 'rgba(255, 110, 220, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(under.x - halfPixels, under.y, halfPixels * 2, floor.y - under.y);
  const front = drawBox(ctx,
    { x0: x - HALF_WIDTH - 0.08, x1: x + HALF_WIDTH + 0.08, y0: BEAM_BOTTOM, y1: BEAM_TOP, z0, z1 }, view.camX, colors);
  // Setas para baixo.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const size = front.h * 0.3;
  [0.25, 0.5, 0.75].forEach((t) => {
    const cx = front.x + front.w * t;
    const cy = front.y + front.h * 0.5 + Math.sin(view.time * 6 + t * 4) * front.h * 0.06;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size * 0.6);
    ctx.lineTo(cx + size, cy - size * 0.6);
    ctx.lineTo(cx, cy + size * 0.7);
    ctx.closePath();
    ctx.fill();
  });
};

const drawBlock = (ctx, x, z, view) => {
  drawGroundShadow(ctx, x, z - HALF_DEPTH.block, view.camX, HALF_WIDTH * 1.25, 0.35);
  const front = drawBox(ctx,
    { x0: x - HALF_WIDTH, x1: x + HALF_WIDTH, y0: 0, y1: BLOCK_HEIGHT, z0: z - HALF_DEPTH.block, z1: z + HALF_DEPTH.block },
    view.camX,
    { side: '#0c6e62', top: '#8ff5dd', front: (rect) => vertical(ctx, rect, '#2fd4b4', '#0f9482') });
  const line = Math.max(1, front.scale * 0.035);
  ctx.strokeStyle = 'rgba(4, 70, 66, 0.75)';
  ctx.lineWidth = line;
  ctx.strokeRect(front.x + line * 1.5, front.y + line * 1.5, front.w - line * 3, front.h - line * 3);
  ctx.beginPath();
  [0.3, 0.5, 0.7].forEach((t) => {
    ctx.moveTo(front.x + front.w * t, front.y + front.h * 0.42);
    ctx.lineTo(front.x + front.w * t, front.y + front.h - line * 2);
  });
  ctx.stroke();
  // Placa de aviso.
  const cx = front.x + front.w / 2;
  const cy = front.y + front.h * 0.23;
  const r = front.w * 0.2;
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 1.1, cy + r * 0.8);
  ctx.lineTo(cx - r * 1.1, cy + r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0b5a52';
  ctx.fillRect(cx - r * 0.1, cy - r * 0.45, r * 0.2, r * 0.7);
  ctx.fillRect(cx - r * 0.1, cy + r * 0.4, r * 0.2, r * 0.2);
};

const drawDroneTrack = (ctx, obstacle, zRel, view) => {
  const left = project(laneX(obstacle.a) - HALF_WIDTH, 0, zRel, view.camX);
  const right = project(laneX(obstacle.b) + HALF_WIDTH, 0, zRel, view.camX);
  const thickness = Math.max(1.5, left.scale * 0.12);
  ctx.fillStyle = `rgba(255, 60, 80, ${0.3 + 0.2 * Math.sin(view.time * 9)})`;
  ctx.fillRect(left.x, left.y - thickness / 2, right.x - left.x, thickness);
};

const drawDrone = (ctx, obstacle, zRel, view) => {
  drawDroneTrack(ctx, obstacle, zRel, view);
  const x = laneX(obstacle.lane);
  const bob = Math.sin(view.time * 5 + obstacle.z) * 0.06;
  const floor = project(x, 0, zRel, view.camX);
  const body = project(x, DRONE_HEIGHT + bob, zRel, view.camX);
  const s = body.scale;
  // Feixe ate o chao: deixa claro que a faixa inteira esta bloqueada.
  const beam = ctx.createLinearGradient(0, body.y, 0, floor.y);
  beam.addColorStop(0, 'rgba(255, 70, 90, 0.75)');
  beam.addColorStop(1, 'rgba(255, 70, 90, 0.18)');
  fillPath(ctx, [
    { x: body.x - s * 0.16, y: body.y }, { x: body.x + s * 0.16, y: body.y },
    { x: floor.x + s * HALF_WIDTH, y: floor.y }, { x: floor.x - s * HALF_WIDTH, y: floor.y },
  ], beam);
  ctx.fillStyle = 'rgba(255, 90, 100, 0.55)';
  ctx.beginPath();
  ctx.ellipse(floor.x, floor.y, s * HALF_WIDTH, s * 0.1, 0, 0, TAU);
  ctx.fill();

  // Helices.
  ctx.fillStyle = 'rgba(240, 244, 255, 0.55)';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(body.x + side * s * 0.5, body.y - s * 0.2, s * (0.26 + 0.05 * Math.sin(view.time * 40 + side)), s * 0.05, 0, 0, TAU);
    ctx.fill();
  });
  ctx.strokeStyle = '#2a2350';
  ctx.lineWidth = Math.max(1, s * 0.07);
  ctx.beginPath();
  ctx.moveTo(body.x - s * 0.5, body.y - s * 0.17);
  ctx.lineTo(body.x + s * 0.5, body.y - s * 0.17);
  ctx.stroke();
  const shell = ctx.createLinearGradient(0, body.y - s * 0.26, 0, body.y + s * 0.2);
  shell.addColorStop(0, '#5a4f9c');
  shell.addColorStop(1, '#1d1740');
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(body.x, body.y - s * 0.02, s * 0.34, s * 0.22, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd9de';
  ctx.beginPath();
  ctx.arc(body.x, body.y, s * 0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff2d4a';
  ctx.beginPath();
  ctx.arc(body.x, body.y, s * 0.08, 0, TAU);
  ctx.fill();
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} obstacle obstaculo da simulacao
 * @param {number} zRel metros a frente do robo
 * @param {{camX: number, time: number}} view
 */
export const drawObstacle = (ctx, obstacle, zRel, view) => {
  // Some suave ao passar pela camera, para nao cobrir a tela.
  const alpha = Math.min(1, (zRel + FADE_END) / FADE_METERS);
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const x = laneX(obstacle.lane);
  if (obstacle.kind === KIND.LOW) drawLow(ctx, x, zRel, view);
  else if (obstacle.kind === KIND.HIGH) drawHigh(ctx, x, zRel, view);
  else if (obstacle.kind === KIND.BLOCK) drawBlock(ctx, x, zRel, view);
  else drawDrone(ctx, obstacle, zRel, view);
  ctx.globalAlpha = 1;
};
