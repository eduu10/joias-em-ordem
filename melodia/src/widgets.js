// Pecas de interface usadas em varias telas: botoes, caixas, moeda, barra de progresso, cartao.
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';

const TAU = Math.PI * 2;
export const INK = '#2b1657';
export const GOLD = '#ffd24a';
export const AQUA = '#3df5e0';

// Estilos de botao: [cor de cima, cor de baixo, cor da borda de baixo, cor do texto].
const BUTTON_STYLES = Object.freeze({
  gold: ['#ffe680', '#ffb02e', '#b86a10', INK],
  aqua: ['#7dfbe9', '#1fc7b6', '#0f7f76', '#0d3b3a'],
  green: ['#b8f37a', '#58c93a', '#2f7f1f', '#143d0c'],
  ghost: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)', 'rgba(8, 2, 24, 0.35)', '#ffffff'],
  off: ['#8f8aa8', '#6b6685', '#3c3852', '#2c2940'],
});

export const drawCoin = (ctx, x, y, radius) => {
  ctx.fillStyle = '#b86a10';
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.14, radius, 0, TAU);
  ctx.fill();
  const fill = ctx.createLinearGradient(0, y - radius, 0, y + radius);
  fill.addColorStop(0, '#fff0a0');
  fill.addColorStop(1, '#ffb02e');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  // Uma notinha no meio da moeda.
  ctx.fillStyle = '#b86a10';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.12, y + radius * 0.3, radius * 0.26, radius * 0.19, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillRect(x + radius * 0.06, y - radius * 0.5, radius * 0.14, radius * 0.82);
  ctx.fillRect(x + radius * 0.06, y - radius * 0.5, radius * 0.38, radius * 0.16);
};

export const drawPillBox = (ctx, area, alpha = 0.72) => {
  roundRectPath(ctx, area.x, area.y, area.w, area.h, area.h / 2);
  ctx.fillStyle = `rgba(18, 6, 46, ${alpha})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

export const drawCoinPill = (ctx, area, coins, pop = 0) => {
  drawPillBox(ctx, area);
  drawCoin(ctx, area.x + 19, area.y + area.h / 2, 10 * (1 + pop * 0.3));
  const text = String(coins);
  const size = fitText(ctx, text, area.w - 46, 16);
  drawText(ctx, text, area.x + area.w / 2 + 12, area.y + area.h / 2 + 0.5, size, { color: '#ffe9a8' });
};

/**
 * Botao em forma de pilula com sombra embaixo; afunda quando `pressed`.
 * @param {{style?: string, pressed?: boolean, size?: number, coin?: number}} options
 */
export const drawButton = (ctx, area, label, options = {}) => {
  const { style = 'gold', pressed = false, size = area.h * 0.38, coin = null } = options;
  const [top, bottom, edge, ink] = BUTTON_STYLES[style];
  const drop = pressed ? 3 : 0;
  const radius = Math.min(area.h / 2, 26);
  roundRectPath(ctx, area.x, area.y + 5, area.w, area.h, radius);
  ctx.fillStyle = edge;
  ctx.fill();
  const fill = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  roundRectPath(ctx, area.x, area.y + drop, area.w, area.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  const room = area.w - 28 - (coin === null ? 0 : 24);
  const fitted = fitText(ctx, label, room, size);
  const cx = area.x + area.w / 2 + (coin === null ? 0 : 11);
  const cy = area.y + area.h / 2 + drop + 0.5;
  drawText(ctx, label, cx, cy, fitted, { color: ink, shadow: false });
  if (coin !== null) {
    ctx.font = `800 ${Math.round(fitted)}px system-ui, sans-serif`;
    drawCoin(ctx, cx - ctx.measureText(label).width / 2 - 13, cy - 1, 9);
  }
};

export const drawProgress = (ctx, area, share, color = AQUA) => {
  roundRectPath(ctx, area.x, area.y, area.w, area.h, area.h / 2);
  ctx.fillStyle = 'rgba(8, 2, 24, 0.6)';
  ctx.fill();
  const w = Math.max(area.h, area.w * clamp01(share));
  roundRectPath(ctx, area.x, area.y, w, area.h, area.h / 2);
  ctx.fillStyle = color;
  ctx.fill();
};

// Escurece o fundo e abre um cartao com um pulinho. Quem chama desenha o conteudo e da ctx.restore().
export const openCard = (ctx, bounds, card, t, hues = ['#5b2bb5', '#2a1168']) => {
  const open = clamp01(t / 0.35);
  ctx.fillStyle = `rgba(8, 2, 24, ${0.55 * easeOutCubic(open)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.save();
  const scale = 0.75 + 0.25 * easeOutBack(open);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = easeOutCubic(open);
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, hues[0]);
  fill.addColorStop(1, hues[1]);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRectPath(ctx, card.x, card.y, card.w, card.h, 26);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

// Titulo grande com contorno, usado na tela inicial e no resultado.
export const drawHeadline = (ctx, text, x, y, size, color, maxWidth) => {
  const fitted = fitText(ctx, text, maxWidth, size, 900);
  ctx.font = `900 ${Math.round(fitted)}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1b0a45';
  ctx.lineWidth = fitted * 0.22;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

export const drawToast = (ctx, text, y, alpha) => {
  if (!text || alpha <= 0) return;
  const size = fitText(ctx, text, 300, 14, 700);
  ctx.font = `700 ${Math.round(size)}px system-ui, sans-serif`;
  const width = ctx.measureText(text).width + 28;
  ctx.globalAlpha = clamp01(alpha);
  roundRectPath(ctx, 180 - width / 2, y - 15, width, 30, 15);
  ctx.fillStyle = 'rgba(18, 6, 46, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, text, 180, y + 0.5, size, { weight: 700, shadow: false });
  ctx.globalAlpha = 1;
};
