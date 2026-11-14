// Tela inicial e tela de escolha de categoria. So desenham: nao alteram nada.
import { CATEGORY, CATEGORY_ORDER, DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { BACK_BUTTON, CATEGORY_CARDS, HOME } from './layout.js';
import { levelInfo } from './profile.js';
import { tunesIn } from './tunes.js';
import { CATEGORY_HUE, drawBackArrow, drawCategoryIcon } from './icons.js';
import { MOOD, drawPlayer, drawRobot } from './mascot.js';
import { drawEqualiser, drawVinyl } from './stage.js';
import { AQUA, GOLD, drawButton, drawCoinPill, drawHeadline, drawPillBox, drawProgress } from './widgets.js';

const CX = DESIGN.w / 2;
const isPressed = (ui, key) => ui.press?.key === key;

// Entrada em cascata: cada peca sobe e aparece um pouco depois da anterior.
const enter = (ctx, ui, order, draw) => {
  const t = clamp01((ui.screenT - order * 0.07) / 0.4);
  ctx.save();
  ctx.globalAlpha = easeOutCubic(t);
  ctx.translate(0, (1 - easeOutCubic(t)) * 26);
  draw();
  ctx.restore();
};

export const drawBack = (ctx, ui, strings) => {
  const drop = isPressed(ui, 'back') ? 2 : 0;
  drawPillBox(ctx, { ...BACK_BUTTON, y: BACK_BUTTON.y + drop });
  drawBackArrow(ctx, BACK_BUTTON.x + 18, BACK_BUTTON.y + BACK_BUTTON.h / 2 + drop, 8);
  const size = fitText(ctx, strings.back, BACK_BUTTON.w - 40, 13, 700);
  drawText(ctx, strings.back, BACK_BUTTON.x + 56, BACK_BUTTON.y + BACK_BUTTON.h / 2 + drop + 0.5, size, { weight: 700, shadow: false });
};

const drawLevelBadge = (ctx, profile, strings) => {
  const info = levelInfo(profile.xp);
  const { level } = HOME;
  drawPillBox(ctx, level);
  drawPlayer(ctx, level.x + 18, level.y + level.h / 2, 12, { frameId: profile.equipped.frame, mood: MOOD.IDLE });
  const label = `${strings.level} ${info.level}`;
  drawText(ctx, label, level.x + 76, level.y + 12.5, fitText(ctx, label, 78, 13), { shadow: false });
  drawProgress(ctx, { x: level.x + 36, y: level.y + 22, w: 78, h: 5 }, info.into / info.need);
};

const drawHomeTitle = (ctx, strings, time) => {
  const bob = Math.sin(time * 2) * 3;
  ctx.save();
  ctx.translate(CX, 298 + bob);
  ctx.rotate(-0.035);
  drawHeadline(ctx, strings.title1, 0, 0, 30, '#ffffff', 300);
  drawHeadline(ctx, strings.title2, 0, 46, 58, GOLD, 320);
  ctx.restore();
};

export const drawHome = (ctx, frame) => {
  const { profile, strings, ui } = frame;
  const { vinyl } = HOME;
  drawLevelBadge(ctx, profile, strings);
  drawCoinPill(ctx, HOME.coins, profile.coins, ui.coinPop);
  drawEqualiser(ctx, { x: 52, y: 196, w: 256, h: 70 }, ui.eq, ui.time * 1.6);
  drawVinyl(ctx, vinyl.x, vinyl.y, vinyl.r, ui.spin, (ui.time * 24) % 360, 0.35 + 0.25 * Math.sin(ui.time * 3));
  drawHomeTitle(ctx, strings, ui.time);

  enter(ctx, ui, 1, () => {
    const beat = 1 + 0.025 * Math.sin(ui.time * 5);
    ctx.translate(CX, HOME.play.y + HOME.play.h / 2);
    ctx.scale(beat, beat);
    ctx.translate(-CX, -(HOME.play.y + HOME.play.h / 2));
    drawButton(ctx, HOME.play, strings.play, { pressed: isPressed(ui, 'play'), size: 30 });
  });
  enter(ctx, ui, 2, () => drawButton(ctx, HOME.shop, strings.shop, { style: 'aqua', pressed: isPressed(ui, 'shop'), size: 19 }));
  if (profile.adReady) {
    enter(ctx, ui, 3, () => drawButton(ctx, HOME.ad, strings.homeAd, { style: 'green', pressed: isPressed(ui, 'homeAd'), size: 16 }));
  }
  const stats = `${strings.wins}: ${profile.wins}   ·   ${strings.best}: ${profile.best} ${strings.points}`;
  drawText(ctx, stats, CX, 604, fitText(ctx, stats, 330, 13, 700), { weight: 700, color: '#f3e6ff' });
  drawText(ctx, strings.coinsNote, CX, 624, fitText(ctx, strings.coinsNote, 330, 10, 600), { weight: 600, color: 'rgba(255, 255, 255, 0.62)', shadow: false });
};

const drawCategoryCard = (ctx, category, strings, pressed, time) => {
  const card = CATEGORY_CARDS[category];
  const hue = CATEGORY_HUE[category];
  const wide = category === CATEGORY.MIX;
  const drop = pressed ? 3 : 0;
  roundRectPath(ctx, card.x, card.y + 6, card.w, card.h, 22);
  ctx.fillStyle = `hsl(${hue} 70% 22%)`;
  ctx.fill();
  const fill = ctx.createLinearGradient(card.x, card.y, card.x + card.w, card.y + card.h);
  fill.addColorStop(0, `hsl(${hue} 88% 62%)`);
  fill.addColorStop(1, `hsl(${hue + (wide ? 60 : 24)} 80% 40%)`);
  roundRectPath(ctx, card.x, card.y + drop, card.w, card.h, 22);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Brilho no canto de cima.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  roundRectPath(ctx, card.x + 8, card.y + drop + 7, card.w - 16, card.h * 0.34, 16);
  ctx.fill();

  const sway = Math.sin(time * 2 + hue) * 0.06;
  const iconX = wide ? card.x + 70 : card.x + card.w / 2;
  const iconY = card.y + drop + (wide ? card.h / 2 : 58);
  ctx.save();
  ctx.translate(iconX, iconY);
  ctx.rotate(sway);
  drawCategoryIcon(ctx, category, 0, 0, wide ? 30 : 32);
  ctx.restore();

  const name = strings[`cat_${category}`];
  const count = `${tunesIn(category).length} ${strings.tunes}`;
  const textX = wide ? card.x + 216 : card.x + card.w / 2;
  const textY = card.y + drop + (wide ? card.h / 2 - 10 : 110);
  const room = wide ? 200 : card.w - 20;
  drawText(ctx, name, textX, textY, fitText(ctx, name, room, wide ? 22 : 18));
  drawText(ctx, count, textX, textY + 22, 12, { weight: 600, color: 'rgba(255, 255, 255, 0.85)', shadow: false });
};

export const drawCategory = (ctx, frame) => {
  const { strings, ui } = frame;
  drawBack(ctx, ui, strings);
  drawHeadline(ctx, strings.chooseCategory, CX, 70, 24, '#ffffff', 330);
  CATEGORY_ORDER.forEach((category, index) => {
    const card = CATEGORY_CARDS[category];
    const t = clamp01((ui.screenT - index * 0.06) / 0.35);
    const scale = 0.6 + 0.4 * easeOutBack(t);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(t);
    ctx.translate(card.x + card.w / 2, card.y + card.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(card.x + card.w / 2), -(card.y + card.h / 2));
    drawCategoryCard(ctx, category, strings, isPressed(ui, `cat:${category}`), ui.time);
    ctx.restore();
  });
  // Deixa claro, antes da partida, que o adversario e o proprio jogo.
  drawPillBox(ctx, { x: 30, y: 544, w: 300, h: 62 }, 0.6);
  drawRobot(ctx, 68, 575, 22, { mood: MOOD.IDLE, time: ui.time });
  drawText(ctx, strings.rival, 212, 565, fitText(ctx, strings.rival, 220, 15), { color: AQUA });
  drawText(ctx, strings.rivalNote, 212, 586, fitText(ctx, strings.rivalNote, 220, 11, 600), { weight: 600, color: '#e9ddff', shadow: false });
};
