// Tela da rodada: barra de cima, placa da cantiga, letra, relogio e as quatro cartas. So desenha.
import { CONFIG, PHASE } from './config.js';
import { songById } from './songs.js';
import { CARDS, TIMER } from './layout.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack } from './ease.js';
import { drawLyric } from './lyric.js';
import { drawHeart, drawSign } from './widgets.js';

const TAU = Math.PI * 2;
const CARD_COLORS = Object.freeze([['#ff8a5c', '#c4482a'], ['#5cc7ff', '#2a74c4'], ['#ffd04d', '#c48a1a'], ['#8ee06b', '#3f9a2c']]);

const drawTopBar = (ctx, game, strings, ui) => {
  for (let i = 0; i < CONFIG.lives; i += 1) {
    drawHeart(ctx, 26 + i * 28, 28, 22, i < game.lives, i === game.lives ? ui.heartPop : 0);
  }
  const label = game.mode === 'daily'
    ? `${strings.playDaily} ${Math.min(game.roundNo + 1, CONFIG.dailyRounds)}/${CONFIG.dailyRounds}`
    : `${strings.round} ${game.phase === PHASE.OVER ? game.roundNo : game.roundNo + 1} · ${strings.level} ${game.level}`;
  drawText(ctx, label, 180, 28, fitText(ctx, label, 130, 12, 700), { weight: 700, color: '#ffe9c4' });
  const pop = 1 + ui.scorePop * 0.3;
  drawText(ctx, `${game.score}`, 342, 26, 22 * pop, { align: 'right', color: '#ffe066' });
  drawText(ctx, strings.pts, 342, 44, 10, { align: 'right', weight: 600, color: '#ffe9c4' });
};

const drawPanel = (ctx) => {
  roundRectPath(ctx, 10, 118, 340, 250, 22);
  ctx.fillStyle = 'rgba(28, 8, 44, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 140, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const drawTimer = (ctx, game) => {
  const { round } = game;
  const left = game.phase === PHASE.ASK ? clamp01(1 - game.t / round.answerSeconds) : game.phase === PHASE.LISTEN ? 1 : 0;
  const hue = 10 + 110 * left;
  ctx.beginPath();
  ctx.arc(TIMER.x, TIMER.y, TIMER.r, 0, TAU);
  ctx.fillStyle = 'rgba(30, 8, 40, 0.8)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(TIMER.x, TIMER.y, TIMER.r, -Math.PI / 2, -Math.PI / 2 + TAU * left);
  ctx.strokeStyle = `hsl(${hue} 90% 58%)`;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';
  const seconds = game.phase === PHASE.ASK ? Math.ceil(round.answerSeconds - game.t) : '♪';
  drawText(ctx, `${seconds}`, TIMER.x, TIMER.y + 1, 18, { color: '#fff' });
};

const drawCardBack = (ctx, r, i, time) => {
  const bob = Math.sin(time * 2 + i) * 2;
  roundRectPath(ctx, r.x, r.y + bob, r.w, r.h, 16);
  ctx.fillStyle = '#6b2c7a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 210, 120, 0.18)';
  for (let y = r.y - 10; y < r.y + r.h + 10; y += 16) {
    for (let x = r.x + ((y / 16) % 2) * 8; x < r.x + r.w + 10; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y + bob, 3, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.5)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, r.x, r.y + bob, r.w, r.h, 16);
  ctx.stroke();
  drawText(ctx, '♪', r.x + r.w / 2, r.y + r.h / 2 + bob, 30, { color: 'rgba(255, 230, 180, 0.7)' });
};

const cardState = (game, i) => {
  if (game.phase !== PHASE.REVEAL) return 'open';
  if (i === game.round.correct) return 'right';
  if (i === game.round.picked) return 'wrong';
  return 'dim';
};

const drawCardFace = (ctx, r, i, label, game, ui) => {
  const appear = game.phase === PHASE.ASK ? easeOutBack(clamp01(game.t * 4 - i * 0.25)) : 1;
  const status = cardState(game, i);
  const pressed = ui.press?.key === `card:${i}`;
  const sink = pressed ? 4 : 0;
  const [top, bottom] = status === 'right' ? ['#7dff8e', '#22a34a'] : status === 'wrong' ? ['#ff7a7a', '#b02a2a'] : CARD_COLORS[i];
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  const shake = status === 'wrong' ? Math.sin(game.t * 50) * Math.max(0, 1 - game.t * 2) * 6 : 0;
  const pulse = status === 'right' ? 1 + 0.05 * Math.sin(game.t * 12) : 1;
  ctx.scale(appear * pulse, appear * pulse);
  ctx.translate(-r.w / 2 + shake, -r.h / 2);
  ctx.globalAlpha = status === 'dim' ? 0.4 : 1;
  roundRectPath(ctx, 0, 6, r.w, r.h, 16);
  ctx.fillStyle = 'rgba(40, 10, 30, 0.45)';
  ctx.fill();
  roundRectPath(ctx, 0, sink, r.w, r.h, 16);
  const grad = ctx.createLinearGradient(0, 0, 0, r.h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  drawText(ctx, label, r.w / 2, r.h / 2 + sink, fitText(ctx, label, r.w - 20, 26), {});
  ctx.globalAlpha = 1;
  ctx.restore();
};

const promptFor = (game, strings, ui) => {
  if (ui.needTap) return strings.tapForSound;
  if (game.phase === PHASE.LISTEN) return strings.listen;
  if (game.phase === PHASE.ASK) return strings.pick;
  const label = songById(game.round.songId).words[game.round.word].label;
  if (game.round.right) return game.streak >= 2 ? `${strings.right} ${game.streak} ${strings.streak}` : `${strings.right} +${game.round.points}`;
  return `${game.round.picked < 0 ? strings.timeUp : strings.wrong} "${label}"`;
};

export const drawGame = (ctx, frame) => {
  const { game, strings, ui } = frame;
  const song = songById(game.round.songId);
  drawTopBar(ctx, game, strings, ui);
  drawSign(ctx, song.title, 180, 86, 300);
  drawPanel(ctx);
  drawLyric(ctx, game, ui.time);
  const prompt = promptFor(game, strings, ui);
  const color = game.phase === PHASE.REVEAL ? (game.round.right ? '#b8ffb0' : '#ffc2b5') : '#fff1d0';
  drawText(ctx, prompt, 180, 344, fitText(ctx, prompt, 300, 15), { color });
  drawTimer(ctx, game);
  CARDS.forEach((r, i) => {
    if (game.phase === PHASE.LISTEN) drawCardBack(ctx, r, i, ui.time);
    else drawCardFace(ctx, r, i, game.round.options[i], game, ui);
  });
};
