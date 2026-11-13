// Interface, toda no espaco de 360 x 640: barra do alto, botao de invocar, avisos e cartoes.
import { DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';

const TAU = Math.PI * 2;
const INK = '#3b1a70';
const GOLD_TOP = '#ffe27a';
const GOLD_BOTTOM = '#ffb23e';

export const BUY_BUTTON = Object.freeze({ x: 80, y: 560, w: 200, h: 54 });
export const PANEL = Object.freeze({
  card: Object.freeze({ x: 36, y: 176, w: 288, h: 262 }),
  primary: Object.freeze({ x: 62, y: 318, w: 236, h: 52 }),
  secondary: Object.freeze({ x: 62, y: 380, w: 236, h: 40 }),
});

export const inRect = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

const goldFill = (ctx, top, bottom) => {
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, GOLD_TOP);
  fill.addColorStop(1, GOLD_BOTTOM);
  return fill;
};

export const drawCoin = (ctx, x, y, radius) => {
  ctx.fillStyle = '#c9811a';
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.14, radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = goldFill(ctx, y - radius, y + radius);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 90, 0, 0.6)';
  ctx.lineWidth = Math.max(1, radius * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.62, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.35, y - radius * 0.42, radius * 0.26, radius * 0.13, -0.6, 0, TAU);
  ctx.fill();
};

const drawHeart = (ctx, x, y, size) => {
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.4, y, x - size * 0.7, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.7, y - size, x + size * 1.4, y, x, y + size * 0.9);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(x - size * 0.4, y - size * 0.3, size * 0.2, 0, TAU);
  ctx.fill();
};

const drawPillBox = (ctx, x, y, w, h) => {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(30, 14, 70, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

// `info`: { wave, coins, baseHp, hpFlash, coinPop }
export const drawTopBar = (ctx, info, strings) => {
  const y = 10;
  const h = 26;
  drawPillBox(ctx, 10, y, 96, h);
  drawText(ctx, `${strings.wave} ${info.wave}`, 58, y + h / 2 + 0.5, 13);

  drawPillBox(ctx, 118, y, 104, h);
  drawCoin(ctx, 134, y + h / 2, 8 * (1 + info.coinPop * 0.25));
  drawText(ctx, String(info.coins), 176, y + h / 2 + 0.5, 14, { color: '#ffe9a8' });

  drawPillBox(ctx, 234, y, 64, h);
  drawHeart(ctx, 251, y + h / 2 - 1, 7 * (1 + info.hpFlash * 0.4));
  drawText(ctx, String(info.baseHp), 276, y + h / 2 + 0.5, 14, { color: info.hpFlash > 0 ? '#ff9aa8' : '#ffffff' });
};

// `state`: { cost, enabled, pressed }
export const drawBuyButton = (ctx, state, strings) => {
  const { x, y, w, h } = BUY_BUTTON;
  const drop = state.pressed ? 2 : 0;
  roundRectPath(ctx, x, y + 5, w, h, h / 2);
  ctx.fillStyle = state.enabled ? '#b86a10' : '#4a4a5c';
  ctx.fill();
  roundRectPath(ctx, x, y + drop, w, h, h / 2);
  if (state.enabled) {
    ctx.fillStyle = goldFill(ctx, y, y + h);
  } else {
    ctx.fillStyle = '#8b8ba1';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const label = strings.summon;
  const size = fitText(ctx, label, 96, 19);
  const color = state.enabled ? INK : '#3d3d50';
  drawText(ctx, label, x + 70, y + h / 2 + drop, size, { color, shadow: false });
  drawCoin(ctx, x + 134, y + h / 2 + drop, 10);
  drawText(ctx, String(state.cost), x + 166, y + h / 2 + drop, 18, { color, shadow: false });
};

export const drawCaption = (ctx, text, y, alpha = 1) => {
  if (!text || alpha <= 0) return;
  const size = fitText(ctx, text, DESIGN.w - 30, 13, 700);
  ctx.font = `700 ${Math.round(size)}px system-ui, sans-serif`;
  const width = ctx.measureText(text).width + 22;
  ctx.globalAlpha = alpha;
  roundRectPath(ctx, DESIGN.w / 2 - width / 2, y - 12, width, 24, 12);
  ctx.fillStyle = 'rgba(30, 14, 70, 0.78)';
  ctx.fill();
  drawText(ctx, text, DESIGN.w / 2, y + 0.5, size, { weight: 700, shadow: false });
  ctx.globalAlpha = 1;
};

// Faixa que cruza a tela no comeco de cada onda.
export const drawBanner = (ctx, banner) => {
  if (!banner) return;
  const enter = easeOutBack(clamp01(banner.t / 0.3));
  const leave = clamp01((banner.t - 1.2) / 0.3);
  ctx.save();
  ctx.globalAlpha = 1 - leave;
  ctx.translate(DESIGN.w / 2, 232);
  ctx.scale(0.4 + 0.6 * enter, 0.4 + 0.6 * enter);
  ctx.fillStyle = banner.boss ? 'rgba(120, 20, 60, 0.85)' : 'rgba(30, 14, 70, 0.82)';
  ctx.fillRect(-DESIGN.w, -30, DESIGN.w * 2, 60);
  ctx.fillStyle = banner.boss ? '#ff6b8b' : GOLD_TOP;
  ctx.fillRect(-DESIGN.w, -32, DESIGN.w * 2, 3);
  ctx.fillRect(-DESIGN.w, 29, DESIGN.w * 2, 3);
  drawText(ctx, banner.text, 0, 1, 30, { color: banner.boss ? '#ffd0da' : '#ffffff' });
  ctx.restore();
};

const drawPill = (ctx, rect, label, primary) => {
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
  if (primary) {
    ctx.fillStyle = goldFill(ctx, rect.y, rect.y + rect.h);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
  }
  const size = fitText(ctx, label, rect.w * 0.86, rect.h * (primary ? 0.36 : 0.42), primary ? 800 : 700);
  drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5, size, {
    color: primary ? INK : '#ffffff', weight: primary ? 800 : 700, shadow: false,
  });
};

const openCard = (ctx, bounds, t, card) => {
  const open = clamp01(t / 0.3);
  ctx.fillStyle = `rgba(10, 3, 34, ${0.6 * easeOutCubic(open)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const scale = 0.7 + 0.3 * easeOutBack(open);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = easeOutCubic(open);
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, '#8f4be0');
  fill.addColorStop(1, '#4f25a8');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  roundRectPath(ctx, card.x, card.y, card.w, card.h, 22);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

// `content`: { wave, best, canRevive }
export const drawOverPanel = (ctx, bounds, content, strings, t) => {
  const { card } = PANEL;
  ctx.save();
  openCard(ctx, bounds, t, card);
  const cx = card.x + card.w / 2;
  drawText(ctx, strings.gameOver, cx, card.y + 42, fitText(ctx, strings.gameOver, card.w * 0.86, 25));
  drawText(ctx, `${strings.reached} ${content.wave}`, cx, card.y + 82, 15, { color: '#e9ddff', weight: 600 });
  drawText(ctx, `${strings.best} ${content.best}`, cx, card.y + 108, 14, { color: GOLD_TOP, weight: 700 });
  if (content.canRevive) {
    drawPill(ctx, PANEL.primary, strings.reviveAd, true);
    drawPill(ctx, PANEL.secondary, strings.playAgain, false);
  } else {
    drawPill(ctx, PANEL.primary, strings.playAgain, true);
  }
  ctx.restore();
};

export const drawTitle = (ctx, bounds, strings, best, time) => {
  ctx.fillStyle = 'rgba(10, 3, 34, 0.45)';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const float = Math.sin(time * 2) * 3;
  ctx.save();
  ctx.translate(DESIGN.w / 2, 210 + float);
  ctx.lineJoin = 'round';
  [[strings.title, -24, 50, GOLD_TOP], [strings.subtitle, 26, 40, '#ffffff']].forEach(([text, y, base, color]) => {
    const size = fitText(ctx, text, DESIGN.w - 40, base, 900);
    ctx.font = `900 ${Math.round(size)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#3b1a70';
    ctx.lineWidth = size * 0.22;
    ctx.strokeText(text, 0, y);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, y);
  });
  ctx.restore();
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  ctx.globalAlpha = pulse;
  drawText(ctx, strings.tapToStart, DESIGN.w / 2, 330, 20);
  ctx.globalAlpha = 1;
  if (best > 0) drawText(ctx, `${strings.best} ${best}`, DESIGN.w / 2, 368, 14, { color: GOLD_TOP, weight: 700 });
};
