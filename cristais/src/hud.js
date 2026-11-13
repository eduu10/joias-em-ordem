// Interface durante a partida, no espaco de 360 x 640: pontos, recorde, combo, dica e aviso.
import { DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { drawGem } from './gem.js';

const GOLD = '#ffe08a';
const COMBO_COLOR = Object.freeze([318, 86, 62]);

export const inRect = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

export const drawPillBox = (ctx, x, y, w, h, tint = 'rgba(150, 165, 255, 0.4)') => {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(14, 11, 38, 0.8)';
  ctx.fill();
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

export const drawCrown = (ctx, x, y, size) => {
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

const drawScore = (ctx, value, pop) => {
  const text = String(Math.round(value));
  const size = fitText(ctx, text, 150, 42, 900) * (1 + pop * 0.16);
  ctx.save();
  ctx.shadowColor = 'rgba(110, 200, 255, 0.75)';
  ctx.shadowBlur = 14 + pop * 10;
  drawText(ctx, text, DESIGN.w / 2, 54, size, { color: '#f4fbff', weight: 900 });
  ctx.restore();
};

// `info`: { score, best, combo, pop, time }
export const drawHud = (ctx, info, strings) => {
  const bestText = String(Math.max(info.best, Math.round(info.score)));
  const bestWidth = 44 + bestText.length * 8.4;
  drawPillBox(ctx, 12, 14, bestWidth, 26, 'rgba(255, 224, 138, 0.45)');
  drawCrown(ctx, 28, 27, 7);
  drawText(ctx, bestText, 12 + bestWidth / 2 + 10, 27.5, 13, { color: GOLD });
  drawText(ctx, strings.best.toUpperCase(), 12 + bestWidth / 2, 50, 8, { color: 'rgba(255, 224, 138, 0.7)', weight: 700, shadow: false });

  drawScore(ctx, info.score, info.pop);

  if (info.combo >= 1) {
    const label = `${strings.combo} x${info.combo}`;
    const width = 44 + label.length * 6.6;
    const x = DESIGN.w - 12 - width;
    const beat = 1 + 0.12 * Math.sin(info.time * 8);
    drawPillBox(ctx, x, 14, width, 26, 'rgba(255, 155, 230, 0.6)');
    drawGem(ctx, x + 5, 18, 18, COMBO_COLOR, { scale: beat });
    drawText(ctx, label, x + width / 2 + 9, 27.5, 12, { color: '#ffc4f0' });
  }
};

export const drawCaption = (ctx, text, y, alpha = 1) => {
  if (!text || alpha <= 0) return;
  const size = fitText(ctx, text, DESIGN.w - 44, 13, 700);
  ctx.font = `700 ${Math.round(size)}px system-ui, sans-serif`;
  const width = ctx.measureText(text).width + 24;
  ctx.globalAlpha = alpha;
  drawPillBox(ctx, DESIGN.w / 2 - width / 2, y - 12, width, 24);
  drawText(ctx, text, DESIGN.w / 2, y + 0.5, size, { weight: 700, shadow: false, color: '#e6ecff' });
  ctx.globalAlpha = 1;
};
