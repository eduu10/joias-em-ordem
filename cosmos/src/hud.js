// Interface durante a partida, toda no espaco de 360 x 640: placar, proximo corpo, linha de perigo e avisos.
import { CAPSULE, DESIGN, TIERS } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { drawBody } from './sprites.js';

const GOLD = '#ffe27a';
const SCORE_PILL = Object.freeze({ x: 10, y: 10, w: 108, h: 32 });
const BEST_PILL = Object.freeze({ x: 126, y: 12, w: 104, h: 28 });
const NEXT_PILL = Object.freeze({ x: 238, y: 8, w: 112, h: 36 });
const LADDER_Y = 630;

export const inRect = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

const drawPillBox = (ctx, rect) => {
  const fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  fill.addColorStop(0, 'rgba(58, 44, 130, 0.82)');
  fill.addColorStop(1, 'rgba(20, 14, 66, 0.86)');
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(170, 200, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  roundRectPath(ctx, rect.x + 6, rect.y + 2.5, rect.w - 12, rect.h * 0.3, rect.h * 0.15);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
};

const drawSparkIcon = (ctx, x, y, size, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.15, y - size * 0.15, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.15, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.15, y + size * 0.15, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.15, y - size * 0.15, x, y - size);
  ctx.fill();
};

const drawCrown = (ctx, x, y, size) => {
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x - size, y + size * 0.6);
  ctx.lineTo(x - size, y - size * 0.5);
  ctx.lineTo(x - size * 0.45, y);
  ctx.lineTo(x, y - size * 0.8);
  ctx.lineTo(x + size * 0.45, y);
  ctx.lineTo(x + size, y - size * 0.5);
  ctx.lineTo(x + size, y + size * 0.6);
  ctx.closePath();
  ctx.fill();
};

// `info`: { score, best, pop, next }
export const drawTopBar = (ctx, sprites, info, strings) => {
  drawPillBox(ctx, SCORE_PILL);
  const midY = SCORE_PILL.y + SCORE_PILL.h / 2;
  drawSparkIcon(ctx, SCORE_PILL.x + 17, midY, 8 * (1 + info.pop * 0.4), GOLD);
  const scoreText = String(info.score);
  const scoreSize = fitText(ctx, scoreText, SCORE_PILL.w - 44, 18 * (1 + info.pop * 0.2));
  drawText(ctx, scoreText, SCORE_PILL.x + 28 + (SCORE_PILL.w - 38) / 2, midY + 0.5, scoreSize, { color: '#ffffff' });

  drawPillBox(ctx, BEST_PILL);
  drawCrown(ctx, BEST_PILL.x + 16, midY, 6);
  const bestText = String(Math.max(info.best, info.score));
  drawText(ctx, bestText, BEST_PILL.x + 28 + (BEST_PILL.w - 38) / 2, midY + 0.5, fitText(ctx, bestText, BEST_PILL.w - 42, 14), { color: '#ffe9a8' });

  drawPillBox(ctx, NEXT_PILL);
  const labelSize = fitText(ctx, strings.next, NEXT_PILL.w - 54, 12, 700);
  drawText(ctx, strings.next, NEXT_PILL.x + 12 + (NEXT_PILL.w - 54) / 2, midY + 0.5, labelSize, { color: '#cfd8ff', weight: 700 });
  const radius = 8 + info.next * 1.3;
  drawBody(ctx, sprites, info.next, NEXT_PILL.x + NEXT_PILL.w - 22, midY, radius);
};

// Fila da evolucao no rodape: mostra em que cada corpo vira.
export const drawLadder = (ctx, sprites) => {
  const gap = (DESIGN.w - 48) / (TIERS.length - 1);
  ctx.strokeStyle = 'rgba(200, 215, 255, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  TIERS.forEach((tier, index) => {
    const x = 24 + index * gap;
    drawBody(ctx, sprites, index, x, LADDER_Y, 6.5);
    if (index === TIERS.length - 1) return;
    ctx.beginPath();
    ctx.moveTo(x + gap / 2 - 2, LADDER_Y - 2.5);
    ctx.lineTo(x + gap / 2 + 1, LADDER_Y);
    ctx.lineTo(x + gap / 2 - 2, LADDER_Y + 2.5);
    ctx.stroke();
  });
};

// Linha de perigo: discreta quando esta tudo bem, pulsando em vermelho quando a pilha passa dela.
export const drawDangerLine = (ctx, level, time) => {
  const pulse = 0.5 + 0.5 * Math.sin(time * 14);
  const alpha = level > 0 ? 0.45 + 0.55 * pulse : 0.28 + 0.08 * Math.sin(time * 2);
  const y = CAPSULE.dangerY;
  if (level > 0) {
    const glow = ctx.createLinearGradient(0, y - 26, 0, y + 6);
    glow.addColorStop(0, 'rgba(255, 60, 90, 0)');
    glow.addColorStop(1, `rgba(255, 60, 90, ${0.1 + 0.3 * level * pulse})`);
    ctx.fillStyle = glow;
    ctx.fillRect(CAPSULE.left, y - 26, CAPSULE.right - CAPSULE.left, 32);
  }
  ctx.save();
  ctx.strokeStyle = level > 0 ? `rgba(255, 90, 110, ${alpha})` : `rgba(255, 170, 200, ${alpha})`;
  ctx.lineWidth = level > 0 ? 2 + level * 1.5 : 1.4;
  ctx.setLineDash([7, 6]);
  ctx.lineDashOffset = -time * 14;
  ctx.beginPath();
  ctx.moveTo(CAPSULE.left + 2, y);
  ctx.lineTo(CAPSULE.right - 2, y);
  ctx.stroke();
  ctx.restore();
};

// Linha-guia de onde o corpo vai cair.
export const drawGuide = (ctx, x, fromY, alpha) => {
  if (alpha <= 0) return;
  const fade = ctx.createLinearGradient(0, fromY, 0, CAPSULE.floor);
  fade.addColorStop(0, `rgba(255, 255, 255, ${0.5 * alpha})`);
  fade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.save();
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 7]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, fromY);
  ctx.lineTo(x, CAPSULE.floor);
  ctx.stroke();
  ctx.restore();
};

export const drawCaption = (ctx, text, y, alpha = 1, color = '#ffffff') => {
  if (!text || alpha <= 0) return;
  const size = fitText(ctx, text, CAPSULE.right - CAPSULE.left - 34, 13, 700);
  const width = ctx.measureText(text).width * (size / 13) + 24;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  roundRectPath(ctx, DESIGN.w / 2 - width / 2, y - 13, width, 26, 13);
  ctx.fillStyle = 'rgba(16, 10, 56, 0.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(170, 200, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, text, DESIGN.w / 2, y + 0.5, size, { weight: 700, shadow: false, color });
  ctx.restore();
};

// Aviso grande e rapido no meio da capsula (ex.: "Big Bang!").
export const drawShout = (ctx, shout) => {
  if (!shout) return;
  const enter = Math.min(1, shout.t / 0.18);
  const leave = Math.max(0, (shout.t - 1) / 0.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - leave);
  ctx.translate(DESIGN.w / 2, 300 - leave * 20);
  ctx.scale(0.5 + 0.5 * enter, 0.5 + 0.5 * enter);
  ctx.shadowColor = 'rgba(255, 120, 230, 0.9)';
  ctx.shadowBlur = 18;
  drawText(ctx, shout.text, 0, 0, fitText(ctx, shout.text, 240, 38, 900), { color: GOLD, weight: 900 });
  ctx.restore();
};
