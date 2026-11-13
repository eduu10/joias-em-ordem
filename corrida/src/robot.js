// O personagem: um robo entregador redondinho, com um pacote nas costas e uma antena.
// E desenhado em "pixels na distancia do robo" e escalado pela perspectiva.
import { PLAYER_SCALE } from './camera.js';
import { roundRectPath } from './draw.js';

const TAU = Math.PI * 2;
const BODY_Y = -38;
const BODY_R = 27;
const INK = '#2b2350';
const TEAL = '#22c7b8';

const drawFoot = (ctx, side, pose) => {
  const stride = Math.sin(pose.phase + (side > 0 ? Math.PI : 0));
  const lift = pose.air > 0.02 ? 6 : pose.running ? Math.max(0, stride) * 9 : 0;
  const spread = side * (11 + pose.slide * 5);
  ctx.strokeStyle = '#8f9ccc';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(side * 9, -16);
  ctx.lineTo(spread, -7 - lift);
  ctx.stroke();
  if (pose.air > 0.02) {
    // Jatinhos nos pes enquanto esta no ar.
    const flame = 7 + Math.sin(pose.time * 50 + side) * 3;
    ctx.fillStyle = 'rgba(255, 190, 80, 0.9)';
    ctx.beginPath();
    ctx.moveTo(spread - 4, -4 - lift);
    ctx.lineTo(spread + 4, -4 - lift);
    ctx.lineTo(spread, -4 - lift + flame);
    ctx.closePath();
    ctx.fill();
  }
  roundRectPath(ctx, spread - 7, -10 - lift, 14, 9, 4.5);
  ctx.fillStyle = INK;
  ctx.fill();
};

const drawBody = (ctx) => {
  const shell = ctx.createRadialGradient(-9, BODY_Y - 12, 3, 0, BODY_Y, BODY_R * 1.15);
  shell.addColorStop(0, '#ffffff');
  shell.addColorStop(0.6, '#dfe6fa');
  shell.addColorStop(1, '#98a5d6');
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.arc(0, BODY_Y, BODY_R, 0, TAU);
  ctx.fill();
  // Faixa colorida na cintura, recortada no corpo.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = TEAL;
  ctx.fillRect(-BODY_R, BODY_Y + 9, BODY_R * 2, 7);
  ctx.fillStyle = 'rgba(40, 30, 90, 0.16)';
  ctx.fillRect(-BODY_R, BODY_Y + 16, BODY_R * 2, BODY_R);
  ctx.restore();
  ctx.strokeStyle = 'rgba(60, 50, 120, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, BODY_Y, BODY_R, 0, TAU);
  ctx.stroke();
};

const drawArms = (ctx, pose) => {
  [-1, 1].forEach((side) => {
    const swing = pose.running ? Math.sin(pose.phase) * side * 5 : Math.sin(pose.time * 2 + side) * 1.5;
    const wave = pose.front && side > 0 ? -16 - Math.sin(pose.time * 6) * 4 : 0;
    roundRectPath(ctx, side * BODY_R - 4, BODY_Y - 8, 8, 15, 4);
    ctx.fillStyle = '#149c92';
    ctx.fill();
    ctx.fillStyle = '#eef2ff';
    ctx.strokeStyle = 'rgba(60, 50, 120, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(side * (BODY_R + 5), BODY_Y + 9 + swing + wave, 5.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
  });
};

// De costas (durante a corrida) aparece o pacote da entrega.
const drawParcel = (ctx) => {
  const box = ctx.createLinearGradient(0, BODY_Y - 20, 0, BODY_Y + 6);
  box.addColorStop(0, '#f0b877');
  box.addColorStop(1, '#c98a48');
  roundRectPath(ctx, -15, BODY_Y - 20, 30, 25, 4);
  ctx.fillStyle = box;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110, 66, 20, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#fbe6bd';
  ctx.fillRect(-3, BODY_Y - 20, 6, 25);
  ctx.fillRect(-15, BODY_Y - 10, 30, 5);
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.arc(9, BODY_Y - 1, 2.2, 0, TAU);
  ctx.fill();
};

// De frente (tela inicial) aparece o visor com os olhos.
const drawFace = (ctx, time) => {
  roundRectPath(ctx, -18, BODY_Y - 15, 36, 21, 9);
  ctx.fillStyle = '#1c1640';
  ctx.fill();
  const blink = time % 3.4 > 3.25 ? 0.15 : 1;
  ctx.fillStyle = '#7df6ff';
  ctx.shadowColor = '#7df6ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(-7.5, BODY_Y - 5, 3.6, 5 * blink, 0, 0, TAU);
  ctx.ellipse(7.5, BODY_Y - 5, 3.6, 5 * blink, 0, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#7df6ff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, BODY_Y, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
};

const drawAntenna = (ctx, pose) => {
  const sway = -pose.tilt * 22 + Math.sin(pose.phase * 2) * (pose.running ? 1.6 : 0.6) - pose.vy * 0.4;
  const tipX = sway;
  const tipY = BODY_Y - BODY_R - 17;
  ctx.strokeStyle = '#8f9ccc';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, BODY_Y - BODY_R + 1);
  ctx.quadraticCurveTo(0, tipY + 4, tipX, tipY);
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(pose.time * 6);
  ctx.fillStyle = `rgba(125, 246, 255, ${0.25 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 7.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8fbff';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.6, 0, TAU);
  ctx.fill();
};

const drawAuras = (ctx, pose) => {
  if (pose.magnet) {
    ctx.strokeStyle = 'rgba(255, 90, 130, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -pose.time * 40;
    ctx.beginPath();
    ctx.arc(0, BODY_Y, 47 + Math.sin(pose.time * 8) * 2, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (pose.shield) {
    const radius = 42 + Math.sin(pose.time * 4) * 1.2;
    const bubble = ctx.createRadialGradient(0, BODY_Y, radius * 0.55, 0, BODY_Y, radius);
    bubble.addColorStop(0, 'rgba(120, 220, 255, 0)');
    bubble.addColorStop(1, 'rgba(120, 220, 255, 0.42)');
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(0, BODY_Y, radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, BODY_Y, radius - 6, 1.15 * Math.PI, 1.4 * Math.PI);
    ctx.stroke();
  }
};

// Sombra macia no chao: encolhe e clareia conforme o robo sobe.
export const drawRobotShadow = (ctx, x, y, scale, air) => {
  const k = (scale / PLAYER_SCALE) * Math.max(0.45, 1 - air * 0.3);
  ctx.fillStyle = `rgba(14, 6, 46, ${Math.max(0.1, 0.34 - air * 0.12)})`;
  ctx.beginPath();
  ctx.ellipse(x, y, 30 * k, 8.5 * k, 0, 0, TAU);
  ctx.fill();
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} pose { x, y, scale, phase, time, air, vy, slide, tilt, running, front, alpha, shield, magnet, crash }
 *   `x`/`y` sao os pes na tela; `slide` vai de 0 a 1; `crash` sao os segundos desde a batida (ou -1).
 */
export const drawRobot = (ctx, pose) => {
  const k = pose.scale / PLAYER_SCALE;
  const fall = pose.crash >= 0 ? Math.min(1, pose.crash / 0.55) : 0;
  const stretch = pose.air > 0.02 ? Math.max(-0.12, Math.min(0.14, pose.vy * 0.014)) : 0;
  const sy = (1 + stretch) * (1 - pose.slide * 0.4);
  const sx = (1 - stretch * 0.7) * (1 + pose.slide * 0.22);
  const bob = pose.running && pose.air <= 0.02 ? -Math.abs(Math.sin(pose.phase)) * 3.2 : Math.sin(pose.time * 2.4) * 1.2;
  ctx.save();
  ctx.globalAlpha = pose.alpha;
  ctx.translate(pose.x + fall * 16 * k, pose.y - (Math.sin(fall * Math.PI) * 34 + fall * 24) * k);
  ctx.scale(k, k);
  ctx.rotate(pose.tilt + fall * 1.75);
  ctx.scale(sx, sy);
  ctx.translate(0, bob * (1 - pose.slide) * (1 - fall));
  drawFoot(ctx, -1, pose);
  drawFoot(ctx, 1, pose);
  drawArms(ctx, pose);
  drawBody(ctx);
  if (pose.front) drawFace(ctx, pose.time);
  else drawParcel(ctx);
  drawAntenna(ctx, pose);
  drawAuras(ctx, pose);
  ctx.restore();
};
