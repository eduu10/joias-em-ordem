// Telas por cima do jogo: titulo animado e cartao de fim de partida.
import { DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { drawBody } from './sprites.js';

const TAU = Math.PI * 2;
const INK = '#1d0f4a';
const GOLD_TOP = '#ffe27a';
const GOLD_BOTTOM = '#ffa94d';
const TITLE_Y = 226;
const ORBIT = Object.freeze({ rx: 142, ry: 44, tilt: -0.16, speed: 0.55 });
const ORBITERS = Object.freeze([0, 3, 1, 6, 2, 8, 4, 5]);

export const PANEL = Object.freeze({
  card: Object.freeze({ x: 34, y: 158, w: 292, h: 300 }),
  primary: Object.freeze({ x: 60, y: 334, w: 240, h: 54 }),
  secondary: Object.freeze({ x: 60, y: 398, w: 240, h: 42 }),
});

// Corpos girando em volta do titulo. `front` escolhe a metade da orbita que passa na frente do texto.
const drawOrbiters = (ctx, sprites, time, front) => {
  ORBITERS.forEach((tier, index) => {
    const angle = time * ORBIT.speed + (index / ORBITERS.length) * TAU;
    const depth = Math.sin(angle);
    if ((depth > 0) !== front) return;
    const ox = Math.cos(angle) * ORBIT.rx;
    const oy = depth * ORBIT.ry;
    const x = DESIGN.w / 2 + ox * Math.cos(ORBIT.tilt) - oy * Math.sin(ORBIT.tilt);
    const y = TITLE_Y + ox * Math.sin(ORBIT.tilt) + oy * Math.cos(ORBIT.tilt);
    const radius = (9 + tier * 1.5) * (0.82 + 0.18 * depth);
    drawBody(ctx, sprites, tier, x, y, radius, { rot: time * (0.6 + index * 0.13), alpha: 0.75 + 0.25 * depth });
  });
};

const drawTitleWord = (ctx, text, y, base, colors) => {
  const size = fitText(ctx, text, DESIGN.w - 70, base, 900);
  ctx.font = `900 ${Math.round(size)}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = colors[2];
  ctx.shadowBlur = 22;
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.2;
  ctx.strokeText(text, 0, y);
  ctx.shadowColor = 'transparent';
  const fill = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
  fill.addColorStop(0, colors[0]);
  fill.addColorStop(1, colors[1]);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, y);
};

export const drawTitle = (ctx, sprites, bounds, strings, best, time) => {
  ctx.fillStyle = 'rgba(6, 3, 30, 0.5)';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  drawOrbiters(ctx, sprites, time, false);
  ctx.save();
  ctx.translate(DESIGN.w / 2, TITLE_Y + Math.sin(time * 2) * 3);
  drawTitleWord(ctx, strings.title, -26, 54, ['#ffffff', '#8fe3ff', 'rgba(90, 200, 255, 0.9)']);
  drawTitleWord(ctx, strings.subtitle, 28, 46, [GOLD_TOP, '#ff8ad0', 'rgba(255, 110, 220, 0.9)']);
  ctx.restore();
  drawOrbiters(ctx, sprites, time, true);

  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  const label = strings.tapToStart;
  const size = fitText(ctx, label, 190, 19);
  const width = Math.min(230, ctx.measureText(label).width * (size / 19) + 54) * (1 + pulse * 0.03);
  roundRectPath(ctx, DESIGN.w / 2 - width / 2, 352, width, 46, 23);
  const fill = ctx.createLinearGradient(0, 352, 0, 398);
  fill.addColorStop(0, GOLD_TOP);
  fill.addColorStop(1, GOLD_BOTTOM);
  ctx.shadowColor = `rgba(255, 200, 90, ${0.35 + 0.45 * pulse})`;
  ctx.shadowBlur = 20;
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, DESIGN.w / 2, 375.5, size, { color: INK, shadow: false });
  if (best > 0) drawText(ctx, `${strings.best}: ${best}`, DESIGN.w / 2, 424, 14, { color: GOLD_TOP, weight: 700 });
};

// Icone de video (retangulo com seta) para deixar claro que o botao abre um anuncio.
const drawAdIcon = (ctx, x, y) => {
  roundRectPath(ctx, x - 11, y - 8, 22, 16, 4);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = GOLD_TOP;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 4.5);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x - 3, y + 4.5);
  ctx.closePath();
  ctx.fill();
};

const drawPill = (ctx, rect, label, primary, withAdIcon = false) => {
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
  if (primary) {
    const fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    fill.addColorStop(0, GOLD_TOP);
    fill.addColorStop(1, GOLD_BOTTOM);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  const iconSpace = withAdIcon ? 34 : 0;
  const size = fitText(ctx, label, rect.w * 0.86 - iconSpace, rect.h * (primary ? 0.32 : 0.4), primary ? 800 : 700);
  const textWidth = ctx.measureText(label).width * (size / (rect.h * (primary ? 0.32 : 0.4)));
  const cx = rect.x + rect.w / 2 + iconSpace / 2;
  if (withAdIcon) drawAdIcon(ctx, cx - textWidth / 2 - 20, rect.y + rect.h / 2);
  drawText(ctx, label, cx, rect.y + rect.h / 2 + 0.5, size, {
    color: primary ? INK : '#ffffff', weight: primary ? 800 : 700, shadow: false,
  });
};

const openCard = (ctx, bounds, t, card) => {
  const open = clamp01(t / 0.35);
  ctx.fillStyle = `rgba(6, 3, 30, ${0.66 * easeOutCubic(open)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const scale = 0.7 + 0.3 * easeOutBack(open);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = easeOutCubic(open);
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, '#5a3ad0');
  fill.addColorStop(0.55, '#3a1f9a');
  fill.addColorStop(1, '#241060');
  ctx.shadowColor = 'rgba(120, 80, 255, 0.55)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 6;
  roundRectPath(ctx, card.x, card.y, card.w, card.h, 26);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(190, 215, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRectPath(ctx, card.x + 12, card.y + 6, card.w - 24, 34, 17);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
};

// `content`: { score, best, record, canRevive }
export const drawOverPanel = (ctx, bounds, content, strings, t) => {
  const { card } = PANEL;
  ctx.save();
  openCard(ctx, bounds, t, card);
  const cx = card.x + card.w / 2;
  drawText(ctx, strings.gameOver, cx, card.y + 38, fitText(ctx, strings.gameOver, card.w * 0.84, 23));
  drawText(ctx, strings.yourScore.toUpperCase(), cx, card.y + 72, 11, { color: '#bcc6ff', weight: 700, shadow: false });
  const count = Math.round(content.score * easeOutCubic(clamp01((t - 0.2) / 0.8)));
  drawText(ctx, String(count), cx, card.y + 106, fitText(ctx, String(content.score), card.w * 0.8, 46, 900), { color: GOLD_TOP, weight: 900 });
  const bestLine = content.record ? strings.newBest : `${strings.best}: ${content.best}`;
  drawText(ctx, bestLine, cx, card.y + 146, 14, { color: content.record ? '#8fe3ff' : '#e9ddff', weight: 700 });
  if (content.canRevive) {
    drawPill(ctx, PANEL.primary, strings.continueAd, true, true);
    drawPill(ctx, PANEL.secondary, strings.playAgain, false);
  } else {
    drawPill(ctx, PANEL.primary, strings.playAgain, true);
  }
  ctx.restore();
};
