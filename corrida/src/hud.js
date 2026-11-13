// Interface, toda no espaco de 360 x 640: pilulas do alto, avisos, tela inicial e cartao de fim de jogo.
import { CONFIG, DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { drawCoin, drawMagnetIcon, drawShieldIcon } from './items.js';

const INK = '#3b1a70';
const GOLD_TOP = '#ffe27a';
const GOLD_BOTTOM = '#ffb23e';
const PILL_FILL = 'rgba(26, 14, 66, 0.72)';
const CENTER = DESIGN.w / 2;
const NO_REVIVE_TRIM = 62;

export const PANEL = Object.freeze({
  card: Object.freeze({ x: 30, y: 148, w: 300, h: 336 }),
  primary: Object.freeze({ x: 54, y: 356, w: 252, h: 54 }),
  secondary: Object.freeze({ x: 54, y: 422, w: 252, h: 42 }),
});

export const inRect = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

const goldFill = (ctx, top, bottom) => {
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, GOLD_TOP);
  fill.addColorStop(1, GOLD_BOTTOM);
  return fill;
};

const drawPillBox = (ctx, x, y, w, h) => {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = PILL_FILL;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

// Pilula de poder ativo: icone e uma barrinha com o tempo que falta (0 a 1).
const drawPowerPill = (ctx, y, drawIcon, left, color) => {
  drawPillBox(ctx, 10, y, 86, 24);
  drawIcon(ctx, 24, y + 12, 7);
  roundRectPath(ctx, 38, y + 9, 48, 6, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();
  roundRectPath(ctx, 38, y + 9, Math.max(6, 48 * clamp01(left)), 6, 3);
  ctx.fillStyle = color;
  ctx.fill();
};

// `info`: { distance, coins, coinPop, magnetT, shield }
export const drawHud = (ctx, info, strings) => {
  const y = 12;
  const h = 30;
  drawPillBox(ctx, 10, y, 112, h);
  drawText(ctx, `${Math.floor(info.distance)} ${strings.meters}`, 66, y + h / 2 + 0.5, 16);

  drawPillBox(ctx, 250, y, 100, h);
  drawCoin(ctx, 268, y + h / 2, 9 * (1 + info.coinPop * 0.3));
  drawText(ctx, String(info.coins), 312, y + h / 2 + 0.5, 16, { color: '#ffe9a8' });

  let row = y + h + 8;
  if (info.magnetT > 0) {
    drawPowerPill(ctx, row, drawMagnetIcon, info.magnetT / CONFIG.magnetSeconds, '#ff6b8b');
    row += 30;
  }
  if (info.shield) drawPowerPill(ctx, row, drawShieldIcon, 1, '#6fd6ff');
};

export const drawCaption = (ctx, text, y, alpha = 1) => {
  if (!text || alpha <= 0) return;
  const size = fitText(ctx, text, DESIGN.w - 44, 13, 700);
  const width = Math.min(DESIGN.w - 20, ctx.measureText(text).width * (size / 13) + 24);
  ctx.globalAlpha = Math.min(1, alpha);
  roundRectPath(ctx, CENTER - width / 2, y - 13, width, 26, 13);
  ctx.fillStyle = PILL_FILL;
  ctx.fill();
  drawText(ctx, text, CENTER, y + 0.5, size, { weight: 700, shadow: false });
  ctx.globalAlpha = 1;
};

const drawPill = (ctx, rect, label, primary) => {
  if (primary) {
    roundRectPath(ctx, rect.x, rect.y + 4, rect.w, rect.h, rect.h / 2);
    ctx.fillStyle = '#b86a10';
    ctx.fill();
  }
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
  ctx.fillStyle = primary ? goldFill(ctx, rect.y, rect.y + rect.h) : 'rgba(255, 255, 255, 0.16)';
  ctx.fill();
  ctx.strokeStyle = primary ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = primary ? 2 : 1.2;
  ctx.stroke();
  const size = fitText(ctx, label, rect.w * 0.84, rect.h * (primary ? 0.34 : 0.4), primary ? 800 : 700);
  drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5, size, {
    color: primary ? INK : '#ffffff', weight: primary ? 800 : 700, shadow: false,
  });
};

const openCard = (ctx, bounds, t, card) => {
  const open = clamp01(t / 0.3);
  ctx.fillStyle = `rgba(10, 3, 34, ${0.55 * easeOutCubic(open)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const scale = 0.7 + 0.3 * easeOutBack(open);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = easeOutCubic(open);
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, '#7a48d8');
  fill.addColorStop(1, '#3a2396');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundRectPath(ctx, card.x, card.y, card.w, card.h, 24);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const drawStat = (ctx, x, y, label, value, drawIcon) => {
  roundRectPath(ctx, x - 62, y - 22, 124, 44, 14);
  ctx.fillStyle = 'rgba(20, 8, 60, 0.38)';
  ctx.fill();
  drawText(ctx, label, x, y - 9, 10.5, { color: '#d9ccff', weight: 600, shadow: false });
  if (drawIcon) drawIcon(ctx, x - 22, y + 9, 6.5);
  drawText(ctx, value, x + (drawIcon ? 8 : 0), y + 9.5, 15, { shadow: false });
};

// `content`: { score, distance, coins, best, isBest, canRevive }
export const drawOverPanel = (ctx, bounds, content, strings, t) => {
  if (t <= 0) return;
  // Sem o botao de reviver o cartao fica mais baixo.
  const card = content.canRevive ? PANEL.card : { ...PANEL.card, h: PANEL.card.h - NO_REVIVE_TRIM };
  ctx.save();
  openCard(ctx, bounds, t, card);
  drawText(ctx, strings.gameOver, CENTER, card.y + 36, fitText(ctx, strings.gameOver, card.w * 0.84, 22));
  drawText(ctx, strings.score, CENTER, card.y + 66, 12, { color: '#d9ccff', weight: 600, shadow: false });
  const pop = 1 + 0.18 * (1 - clamp01((t - 0.2) / 0.3));
  drawText(ctx, String(content.score), CENTER, card.y + 98, 44 * pop, { color: GOLD_TOP, weight: 900 });
  const bestText = content.isBest ? strings.newBest : `${strings.best}: ${content.best}`;
  drawText(ctx, bestText, CENTER, card.y + 132, 13, { color: content.isBest ? '#8ff5dd' : '#e9ddff', weight: 700 });
  drawStat(ctx, CENTER - 68, card.y + 172, strings.distance, `${content.distance} ${strings.meters}`, null);
  drawStat(ctx, CENTER + 68, card.y + 172, strings.coins, String(content.coins), drawCoin);
  if (content.canRevive) {
    drawPill(ctx, PANEL.primary, strings.reviveAd, true);
    drawPill(ctx, PANEL.secondary, strings.playAgain, false);
  } else {
    drawPill(ctx, PANEL.primary, strings.playAgain, true);
  }
  ctx.restore();
};

const drawLogo = (ctx, strings, time) => {
  ctx.save();
  ctx.translate(CENTER, 118 + Math.sin(time * 2) * 3);
  ctx.rotate(-0.035);
  ctx.lineJoin = 'round';
  [[strings.title, -22, 56, GOLD_TOP], [strings.subtitle, 30, 38, '#ffffff']].forEach(([text, y, base, color]) => {
    const size = fitText(ctx, text, DESIGN.w - 56, base, 900);
    ctx.font = `900 ${Math.round(size)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#2a1466';
    ctx.lineWidth = size * 0.24;
    ctx.strokeText(text, 0, y + 3);
    ctx.strokeText(text, 0, y);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, y);
  });
  ctx.restore();
};

// Lembrete dos controles: setas dentro de pilulas pequenas.
const drawHints = (ctx, strings, y) => {
  const hints = [['← →', strings.hintLane], ['↑', strings.hintJump], ['↓', strings.hintSlide]];
  hints.forEach(([arrows, label], index) => {
    const x = CENTER + (index - 1) * 112;
    drawPillBox(ctx, x - 52, y - 13, 104, 26);
    drawText(ctx, arrows, x - 30, y, 13, { color: GOLD_TOP, shadow: false });
    drawText(ctx, label, x + 14, y + 0.5, fitText(ctx, label, 60, 11.5, 700), { weight: 700, shadow: false });
  });
};

export const drawTitle = (ctx, bounds, strings, best, time) => {
  const veil = ctx.createLinearGradient(0, bounds.y, 0, 260);
  veil.addColorStop(0, 'rgba(14, 6, 50, 0.5)');
  veil.addColorStop(1, 'rgba(14, 6, 50, 0)');
  ctx.fillStyle = veil;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, 260 - bounds.y);
  drawLogo(ctx, strings, time);
  if (best > 0) drawText(ctx, `${strings.best}: ${best}`, CENTER, 196, 14, { color: GOLD_TOP, weight: 700 });
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.save();
  ctx.translate(CENTER, 572);
  ctx.scale(1 + pulse * 0.05, 1 + pulse * 0.05);
  ctx.globalAlpha = 0.75 + 0.25 * pulse;
  drawText(ctx, strings.tapToStart, 0, 0, 22);
  ctx.restore();
  drawHints(ctx, strings, 612);
};
