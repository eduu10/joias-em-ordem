// Cartao de resultado com barra de dano animada, linhas de pontuacao e botoes. So desenha.
import { DESIGN } from './config.js';
import { drawText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { UI, drawButton, drawCoins, drawPanel } from './hud.js';

const LINES = Object.freeze([
  ['damage', 'lineDamage'], ['parts', 'lineParts'], ['glass', 'lineGlass'], ['eject', 'lineEject'],
  ['distance', 'lineDistance'], ['flips', 'lineFlips'], ['air', 'lineAir'],
]);

const barColor = (pct) => (pct < 35 ? '#3ccf5a' : pct < 70 ? '#ffb31f' : '#ff3b2d');

// `info`: { score, coins, record, doubled, canDouble, profileCoins, t }
export const drawResults = (ctx, strings, info) => {
  const { score, t } = info;
  const enter = easeOutBack(clamp01(t / 0.45));
  ctx.save();
  ctx.translate(DESIGN.w / 2, 300);
  ctx.scale(enter, enter);
  ctx.translate(-DESIGN.w / 2, -300);
  drawPanel(ctx, 16, 64, 328, 372, 0.95);
  drawText(ctx, strings.results, DESIGN.w / 2, 92, 20, { color: '#1b2b44', shadow: false, weight: 900 });
  const fill = easeOutCubic(clamp01((t - 0.3) / 1.1));
  const pct = Math.round(score.damagePct * fill);
  drawText(ctx, `${strings.damage}`, 36, 126, 14, { align: 'left', color: '#33415c', shadow: false });
  drawText(ctx, `${pct}%`, 324, 126, 22, { align: 'right', color: barColor(pct), shadow: false, weight: 900 });
  ctx.fillStyle = '#e1e5ec';
  roundRectPath(ctx, 36, 142, 288, 20, 10);
  ctx.fill();
  if (pct > 0) {
    ctx.fillStyle = barColor(pct);
    roundRectPath(ctx, 36, 142, Math.max(20, 288 * (pct / 100)), 20, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    roundRectPath(ctx, 40, 145, Math.max(12, 280 * (pct / 100)), 6, 3);
    ctx.fill();
  }
  let y = 186;
  LINES.forEach(([key, label], i) => {
    const value = score.lines[key];
    const show = clamp01((t - 0.5 - i * 0.12) / 0.2);
    ctx.globalAlpha = show * (value > 0 ? 1 : 0.4);
    drawText(ctx, strings[label], 36, y, 14, { align: 'left', color: '#33415c', shadow: false, weight: 600 });
    drawText(ctx, `+${value}`, 324, y, 15, { align: 'right', color: '#1b2b44', shadow: false });
    y += 26;
  });
  ctx.globalAlpha = 1;
  const totalT = clamp01((t - 1.4) / 0.6);
  ctx.fillStyle = '#e1e5ec';
  ctx.fillRect(36, y - 6, 288, 2);
  drawText(ctx, strings.total, 36, y + 18, 18, { align: 'left', color: '#1b2b44', shadow: false, weight: 900 });
  drawText(ctx, `${Math.round(score.total * totalT)}`, 324, y + 18, 26, { align: 'right', color: '#ff5a1f', shadow: false, weight: 900 });
  drawText(ctx, `+${info.coins} ${strings.coins}`, DESIGN.w / 2, y + 50, 17, { color: '#c98a00', shadow: false });
  if (info.record && t > 1.8) {
    const pop = easeOutBack(clamp01((t - 1.8) / 0.3));
    ctx.save();
    ctx.translate(276, 80);
    ctx.rotate(0.25);
    ctx.scale(pop, pop);
    drawText(ctx, strings.newRecord, 0, 0, 17, { color: '#ff2d6f', weight: 900 });
    ctx.restore();
  }
  ctx.restore();
  drawCoins(ctx, info.profileCoins);
  drawButton(ctx, UI.replay, strings.replay, { color: '#3d7bd9', small: true });
  if (info.canDouble) drawButton(ctx, UI.double, strings.doubleAd, { color: '#7a4dff', small: true, pulse: t * 4 });
  else if (info.doubled) drawText(ctx, strings.doubled, UI.double.x + UI.double.w / 2, UI.double.y + 23, 15, { color: '#e8ddff' });
  drawButton(ctx, UI.again, strings.again, { small: true });
  drawButton(ctx, UI.garage, strings.toGarage, { color: '#2fb35a', small: true });
};

export const drawReplayOverlay = (ctx, strings, bounds, time) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, 56 - bounds.y);
  ctx.fillRect(bounds.x, 584, bounds.w, bounds.y + bounds.h - 584);
  ctx.fillStyle = Math.sin(time * 6) > 0 ? '#ff2d2d' : '#5a1010';
  ctx.beginPath();
  ctx.arc(30, 30, 7, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, strings.replay.toUpperCase(), 44, 30, 15, { align: 'left' });
  drawText(ctx, strings.slowMo, DESIGN.w - 16, 30, 13, { align: 'right', color: '#ffd21f' });
  drawText(ctx, strings.skip, DESIGN.w / 2, 612, 13, { color: '#cfd6e0' });
};
