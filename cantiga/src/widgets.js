// Pecas visuais reaproveitadas: botoes, coracoes, placa de madeira, aviso curto.
import { drawText, fitText, roundRectPath } from './draw.js';

export const drawButton = (ctx, r, label, options = {}) => {
  const { pressed = false, color = '#ff6b3d', dark = '#b8401c', size = 20, sub = '' } = options;
  const sink = pressed ? 4 : 0;
  roundRectPath(ctx, r.x, r.y + 5, r.w, r.h, 18);
  ctx.fillStyle = dark;
  ctx.fill();
  roundRectPath(ctx, r.x, r.y + sink, r.w, r.h, 18);
  const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  grad.addColorStop(0, color);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const textY = r.y + sink + (sub ? r.h / 2 - 7 : r.h / 2);
  drawText(ctx, label, r.x + r.w / 2, textY, fitText(ctx, label, r.w - 28, size), {});
  if (sub) drawText(ctx, sub, r.x + r.w / 2, textY + 19, fitText(ctx, sub, r.w - 28, 12, 600), { weight: 600, color: '#fff3da' });
};

export const drawHeart = (ctx, x, y, size, full, beat = 0) => {
  const s = size * (1 + beat * 0.25);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-12, -2, -9, -12, 0, -6);
  ctx.bezierCurveTo(9, -12, 12, -2, 0, 7);
  ctx.closePath();
  ctx.fillStyle = full ? '#ff4d6d' : 'rgba(255, 255, 255, 0.18)';
  ctx.fill();
  ctx.strokeStyle = full ? '#ffd1da' : 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
};

// Placa de madeira pendurada com o nome da cantiga.
export const drawSign = (ctx, text, cx, y, maxW) => {
  const size = fitText(ctx, text, maxW - 30, 17);
  ctx.font = `800 ${Math.round(size)}px system-ui, sans-serif`;
  const w = Math.min(maxW, ctx.measureText(text).width + 36);
  ctx.strokeStyle = 'rgba(255, 235, 200, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 14, y - 14);
  ctx.lineTo(cx - w / 2 + 22, y - 30);
  ctx.moveTo(cx + w / 2 - 14, y - 14);
  ctx.lineTo(cx + w / 2 - 22, y - 30);
  ctx.stroke();
  roundRectPath(ctx, cx - w / 2, y - 15, w, 30, 8);
  const wood = ctx.createLinearGradient(0, y - 15, 0, y + 15);
  wood.addColorStop(0, '#c98a4b');
  wood.addColorStop(1, '#8a4f22');
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.strokeStyle = '#5c3012';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, text, cx, y + 1, size, { color: '#fff6e0' });
};

export const drawToast = (ctx, text, y, alpha) => {
  if (!text || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const size = fitText(ctx, text, 300, 15);
  roundRectPath(ctx, 24, y - 18, 312, 36, 18);
  ctx.fillStyle = 'rgba(30, 10, 40, 0.85)';
  ctx.fill();
  drawText(ctx, text, 180, y, size, { color: '#fff1c9' });
  ctx.globalAlpha = 1;
};
