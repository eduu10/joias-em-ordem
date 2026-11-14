// Tela de resultado, lojinha e o aviso de som desligado. So desenham: nao alteram nada.
import { DESIGN, OUTCOME, SHOP_ITEMS, SHOP_KIND } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutCubic, lerp } from './ease.js';
import { RESULT, SHOP } from './layout.js';
import { isOwned } from './profile.js';
import { drawSpeaker } from './icons.js';
import { MOOD, drawPlayer, drawRobot } from './mascot.js';
import { drawNoteGlyph } from './stage.js';
import { drawBack } from './screens-home.js';
import { AQUA, GOLD, drawButton, drawCoin, drawCoinPill, drawHeadline, drawProgress, openCard } from './widgets.js';

const CX = DESIGN.w / 2;
const COUNT_SECONDS = 0.9;
const HEADLINE = Object.freeze({
  [OUTCOME.WIN]: { key: 'win', color: GOLD, hues: ['#7a3fe0', '#3a1590'] },
  [OUTCOME.TIE]: { key: 'tie', color: AQUA, hues: ['#3f6fe0', '#1d2f90'] },
  [OUTCOME.LOSE]: { key: 'lose', color: '#ffd0d8', hues: ['#6a3a9a', '#2c1458'] },
});

// Botoes do resultado, de cima para baixo. Quem perdeu ve primeiro a revanche com anuncio (opcional).
export const resultButtons = (summary) => (summary.outcome === OUTCOME.LOSE
  ? [{ key: 'rematchAd', area: RESULT.a, style: 'green' }, { key: 'playAgain', area: RESULT.b, style: 'gold' }, { key: 'home', area: RESULT.c, style: 'ghost' }]
  : [{ key: 'playAgain', area: RESULT.a, style: 'gold' }, { key: 'home', area: RESULT.b, style: 'ghost' }]);

const drawDuel = (ctx, frame, counted) => {
  const { profile, strings, ui } = frame;
  const { summary } = ui;
  const won = summary.outcome === OUTCOME.WIN;
  const lost = summary.outcome === OUTCOME.LOSE;
  drawPlayer(ctx, 104, 176, 36, { mood: lost ? MOOD.SAD : MOOD.HAPPY, time: ui.time, frameId: profile.equipped.frame });
  drawRobot(ctx, 256, 176, 36, { mood: won ? MOOD.SAD : MOOD.HAPPY, time: ui.time });
  drawText(ctx, '×', CX, 178, 26, { color: 'rgba(255, 255, 255, 0.6)' });
  drawText(ctx, String(Math.round(summary.playerScore * counted)), 104, 240, 32, { color: won ? GOLD : '#ffffff' });
  drawText(ctx, String(Math.round(summary.rivalScore * counted)), 256, 240, 32, { color: lost ? GOLD : '#ffffff' });
  drawText(ctx, strings.you, 104, 266, 12, { weight: 700, color: '#e9ddff', shadow: false });
  drawText(ctx, strings.rival, 256, 266, fitText(ctx, strings.rival, 136, 12, 700), { weight: 700, color: AQUA, shadow: false });
};

const drawRewards = (ctx, strings, summary, counted) => {
  const coins = `+${Math.round(summary.coins * counted)}`;
  drawCoin(ctx, CX - 34, 304, 15);
  drawText(ctx, coins, CX + 14, 305, 28, { color: '#ffe9a8' });
  const notes = [
    summary.double ? strings.doubled : null,
    summary.streakBonus > 0 ? `${strings.streakBonus} +${summary.streakBonus}` : null,
    summary.newBest ? strings.newBest : null,
  ].filter(Boolean).join('  ·  ');
  if (notes) drawText(ctx, notes, CX, 332, fitText(ctx, notes, 280, 12, 700), { weight: 700, color: GOLD, shadow: false });

  const { levelBefore, levelAfter } = summary;
  const leveled = levelAfter.level > levelBefore.level;
  const from = leveled ? 0 : levelBefore.into / levelBefore.need;
  const share = lerp(from, levelAfter.into / levelAfter.need, counted);
  const label = leveled ? `${strings.levelUp}  ${strings.level} ${levelAfter.level}` : `${strings.level} ${levelAfter.level}`;
  drawText(ctx, label, CX, 362, fitText(ctx, label, 260, 14), { color: leveled ? GOLD : '#ffffff' });
  drawProgress(ctx, { x: 64, y: 376, w: 232, h: 12 }, share);
  drawText(ctx, `+${summary.xp} XP`, CX, 400, 11, { weight: 700, color: '#d9c8ff', shadow: false });
};

export const drawResult = (ctx, frame) => {
  const { strings, ui, bounds } = frame;
  const { summary } = ui;
  const head = HEADLINE[summary.outcome];
  const counted = easeOutCubic(clamp01((ui.screenT - 0.3) / COUNT_SECONDS));
  openCard(ctx, bounds, RESULT.card, ui.screenT, head.hues);
  drawHeadline(ctx, strings[head.key], CX, RESULT.card.y + 46, 32, head.color, RESULT.card.w - 36);
  drawDuel(ctx, frame, counted);
  drawRewards(ctx, strings, summary, counted);
  resultButtons(summary).forEach((button) => {
    const size = button.key === 'rematchAd' ? 15 : button.area.h * 0.4;
    drawButton(ctx, button.area, strings[button.key], { style: button.style, pressed: ui.press?.key === button.key, size });
  });
  ctx.restore();
};

const drawItemPreview = (ctx, item, x, y, profile, time) => {
  if (item.kind === SHOP_KIND.FRAME) return drawPlayer(ctx, x, y, 26, { frameId: item.id, time });
  ctx.fillStyle = 'rgba(8, 2, 24, 0.5)';
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fill();
  const bob = Math.sin(time * 3) * 2;
  return drawNoteGlyph(ctx, x - 2, y - 2 + bob, 22, item.preset === 'musicbox' ? '#ff9fe0' : '#ffd24a', item.preset !== 'musicbox');
};

const actionFor = (profile, item, strings) => {
  if (!isOwned(profile, item.id)) {
    return { label: String(item.price), style: profile.coins >= item.price ? 'gold' : 'off', coin: item.price };
  }
  return profile.equipped[item.kind] === item.id ? { label: strings.inUse, style: 'aqua' } : { label: strings.use, style: 'ghost' };
};

const drawShopRow = (ctx, frame, item, row) => {
  const { profile, strings, ui } = frame;
  const equipped = profile.equipped[item.kind] === item.id;
  roundRectPath(ctx, row.x, row.y, row.w, row.h, 20);
  ctx.fillStyle = equipped ? 'rgba(61, 245, 224, 0.2)' : 'rgba(18, 6, 46, 0.7)';
  ctx.fill();
  ctx.strokeStyle = equipped ? AQUA : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = equipped ? 2 : 1.2;
  ctx.stroke();
  drawItemPreview(ctx, item, row.x + 44, row.y + row.h / 2, profile, ui.time);
  const name = strings[`item_${item.id}`];
  const kind = strings[`kind_${item.kind}`];
  drawText(ctx, name, row.x + 84, row.y + 32, fitText(ctx, name, 124, 15), { align: 'left' });
  drawText(ctx, kind, row.x + 84, row.y + 54, fitText(ctx, kind, 124, 11, 600), { align: 'left', weight: 600, color: '#d9c8ff', shadow: false });
  const action = actionFor(profile, item, strings);
  drawButton(ctx, SHOP.action(row), action.label, {
    style: action.style, pressed: ui.press?.key === `item:${item.id}`, size: 15, coin: action.coin ?? null,
  });
};

export const drawShop = (ctx, frame) => {
  const { profile, strings, ui } = frame;
  drawBack(ctx, ui, strings);
  drawHeadline(ctx, strings.shop, CX, 32, 22, '#ffffff', 120);
  drawCoinPill(ctx, SHOP.coins, profile.coins, ui.coinPop);
  SHOP_ITEMS.forEach((item, index) => {
    const t = clamp01((ui.screenT - index * 0.05) / 0.3);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(t);
    ctx.translate((1 - easeOutCubic(t)) * 40, 0);
    drawShopRow(ctx, frame, item, SHOP.rows[index]);
    ctx.restore();
  });
  drawText(ctx, strings.shopNote, CX, 562, fitText(ctx, strings.shopNote, 330, 11, 600), { weight: 600, color: '#e9ddff', shadow: false });
  drawText(ctx, strings.coinsNote, CX, 582, fitText(ctx, strings.coinsNote, 330, 10, 600), { weight: 600, color: 'rgba(255, 255, 255, 0.62)', shadow: false });
};

// O jogo depende do som: com o audio desligado no YouTube, a tela inteira pede para ligar.
export const drawMuted = (ctx, frame) => {
  const { strings, ui, bounds } = frame;
  ctx.fillStyle = 'rgba(8, 2, 24, 0.9)';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const bob = Math.sin(ui.time * 2.4) * 4;
  ctx.fillStyle = 'rgba(255, 92, 122, 0.16)';
  ctx.beginPath();
  ctx.arc(CX, 232 + bob, 78 + Math.sin(ui.time * 3) * 4, 0, Math.PI * 2);
  ctx.fill();
  drawSpeaker(ctx, CX - 8, 232 + bob, 44, true, ui.time);
  drawHeadline(ctx, strings.mutedTitle, CX, 350, 26, GOLD, 330);
  drawText(ctx, strings.mutedLine1, CX, 394, fitText(ctx, strings.mutedLine1, 320, 15, 600), { weight: 600 });
  drawText(ctx, strings.mutedLine2, CX, 420, fitText(ctx, strings.mutedLine2, 320, 15, 600), { weight: 600, color: '#d9c8ff' });
};
