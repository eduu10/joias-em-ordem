// Telas por cima do jogo: abertura e cartao de fim de partida.
import { DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { SHAPES } from './shapes.js';
import { drawPiece } from './board.js';
import { drawSparkle } from './gem.js';
import { drawCrown } from './hud.js';

const INK = '#12203a';
const GOLD = '#ffe08a';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const PANEL = Object.freeze({
  card: Object.freeze({ x: 34, y: 166, w: 292, h: 292 }),
  primary: Object.freeze({ x: 58, y: 322, w: 244, h: 60 }),
  secondary: Object.freeze({ x: 58, y: 394, w: 244, h: 44 }),
});

const shapeOf = (family) => SHAPES.find((shape) => shape.family === family);
// Pecas que flutuam na abertura: [familia, x, y, tamanho da casa, fase].
const TITLE_PIECES = Object.freeze([
  ['t', 84, 122, 26, 0], ['o2', 286, 138, 26, 1.4], ['l', 62, 452, 24, 2.6], ['z', 292, 470, 24, 3.9], ['i3', 182, 528, 22, 5.1],
].map(([family, x, y, cell, phase]) => Object.freeze({ shape: shapeOf(family), x, y, cell, phase })));

const drawTitleWord = (ctx, text, y, base, top, bottom) => {
  const size = fitText(ctx, text, DESIGN.w - 48, base, 900);
  ctx.font = `900 ${Math.round(size)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = top;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = '#0a0722';
  ctx.lineWidth = size * 0.2;
  ctx.strokeText(text, 0, y);
  ctx.shadowBlur = 0;
  const fill = ctx.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.45);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.45, top);
  fill.addColorStop(1, bottom);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, y);
};

export const drawTitle = (ctx, bounds, strings, best, time) => {
  ctx.fillStyle = 'rgba(6, 4, 20, 0.62)';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  TITLE_PIECES.forEach((piece) => {
    const y = piece.y + Math.sin(time * 1.6 + piece.phase) * 7;
    ctx.save();
    ctx.translate(piece.x, y);
    ctx.rotate(Math.sin(time * 0.9 + piece.phase) * 0.14);
    drawPiece(ctx, piece.shape, { x: 0, y: 0, cell: piece.cell }, { glow: 0.7 });
    ctx.restore();
  });
  ctx.save();
  ctx.translate(DESIGN.w / 2, 252 + Math.sin(time * 2) * 3);
  drawTitleWord(ctx, strings.title, -28, 58, '#8fe9ff', '#3f8dff');
  drawTitleWord(ctx, strings.subtitle, 28, 42, '#f0b8ff', '#9a4dff');
  ctx.restore();
  const blink = Math.max(0, Math.sin(time * 2.4)) ** 4;
  drawSparkle(ctx, 286, 204, 13 * blink, blink);
  drawSparkle(ctx, 70, 290, 10 * (1 - blink), 1 - blink);

  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  const size = fitText(ctx, strings.tapToStart, 190, 19);
  ctx.globalAlpha = 0.7 + 0.3 * pulse;
  roundRectPath(ctx, 70 - pulse * 3, 348 - pulse, 220 + pulse * 6, 46 + pulse * 2, 24);
  ctx.fillStyle = 'rgba(60, 150, 255, 0.28)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 225, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, strings.tapToStart, DESIGN.w / 2, 371.5, size);
  ctx.globalAlpha = 1;
  if (best > 0) {
    drawCrown(ctx, DESIGN.w / 2 - 44, 418, 7);
    drawText(ctx, `${strings.best}: ${best}`, DESIGN.w / 2 + 8, 419, 14, { color: GOLD, weight: 700 });
  }
};

const drawAdIcon = (ctx, x, y) => {
  roundRectPath(ctx, x - 11, y - 8, 22, 16, 4);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = '#bff4ff';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 4.5);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x - 3, y + 4.5);
  ctx.closePath();
  ctx.fill();
};

// `button`: { label, sub, primary, icon }
const drawButton = (ctx, rect, button) => {
  const radius = Math.min(rect.h / 2, 22);
  if (button.primary) {
    roundRectPath(ctx, rect.x, rect.y + 4, rect.w, rect.h, radius);
    ctx.fillStyle = '#1a6f96';
    ctx.fill();
    const fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    fill.addColorStop(0, '#b4f6ff');
    fill.addColorStop(1, '#4fc4ee');
    roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 215, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  const color = button.primary ? INK : '#ffffff';
  const cx = rect.x + rect.w / 2 + (button.icon ? 13 : 0);
  const room = rect.w - (button.icon ? 70 : 36);
  const mainY = rect.y + rect.h / 2 + (button.sub ? -8 : 0.5);
  const size = fitText(ctx, button.label, room, button.sub ? 16 : 17, 800);
  drawText(ctx, button.label, cx, mainY, size, { color, shadow: false });
  if (button.sub) {
    const subSize = fitText(ctx, button.sub, room, 11, 600);
    drawText(ctx, button.sub, cx, rect.y + rect.h / 2 + 12, subSize, { color: 'rgba(18, 32, 58, 0.75)', weight: 600, shadow: false });
  }
  if (button.icon) drawAdIcon(ctx, rect.x + 30, rect.y + rect.h / 2);
};

const openCard = (ctx, bounds, open, card) => {
  ctx.fillStyle = `rgba(4, 3, 16, ${0.66 * easeOutCubic(open)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const scale = 0.7 + 0.3 * easeOutBack(open);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = easeOutCubic(open);
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, '#3a3476');
  fill.addColorStop(1, '#1a1640');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRectPath(ctx, card.x, card.y, card.w, card.h, 24);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(150, 225, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

// `content`: { score, best, newBest, canRevive }. `t` e o tempo desde que o cartao abriu.
export const drawOverCard = (ctx, bounds, content, strings, t) => {
  if (t <= 0) return;
  const { card } = PANEL;
  const cx = card.x + card.w / 2;
  ctx.save();
  openCard(ctx, bounds, clamp01(t / 0.3), card);
  drawText(ctx, strings.gameOver, cx, card.y + 36, fitText(ctx, strings.gameOver, card.w * 0.84, 24));
  drawText(ctx, strings.score.toUpperCase(), cx, card.y + 66, 10, { color: 'rgba(200, 215, 255, 0.75)', weight: 700, shadow: false });
  drawText(ctx, String(content.score), cx, card.y + 94, fitText(ctx, String(content.score), 200, 40, 900), { weight: 900 });
  if (content.newBest) {
    const beat = 1 + 0.06 * Math.sin(t * 7);
    drawText(ctx, strings.newBest, cx, card.y + 131, 16 * beat, { color: GOLD });
    drawSparkle(ctx, cx - 78, card.y + 130, 8 * beat, 0.9);
    drawSparkle(ctx, cx + 78, card.y + 130, 8 * beat, 0.9);
  } else {
    drawCrown(ctx, cx - 46, card.y + 130, 6);
    drawText(ctx, `${strings.best}: ${content.best}`, cx + 6, card.y + 131, 14, { color: GOLD, weight: 700 });
  }
  if (content.canRevive) {
    drawButton(ctx, PANEL.primary, { label: strings.reviveAd, sub: strings.reviveInfo, primary: true, icon: true });
    drawButton(ctx, PANEL.secondary, { label: strings.playAgain, primary: false });
  } else {
    drawButton(ctx, PANEL.primary, { label: strings.playAgain, primary: true });
  }
  ctx.restore();
};
