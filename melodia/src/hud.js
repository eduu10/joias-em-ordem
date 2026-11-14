// Tela da partida, toda no espaco de 360 x 640: placar, disco com o tempo, equalizador e cartoes de resposta.
import { CONFIG, DESIGN, PHASE } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';
import { MATCH } from './layout.js';
import { currentQuestion } from './quiz.js';
import { tuneById, tuneTitle } from './tunes.js';
import { CATEGORY_HUE } from './icons.js';
import { MOOD, drawPlayer, drawRobot } from './mascot.js';
import { drawEqualiser, drawTimerRing, drawVinyl } from './stage.js';
import { AQUA, GOLD, INK, drawHeadline, drawPillBox } from './widgets.js';

const CX = DESIGN.w / 2;
const TAU = Math.PI * 2;
const CARD_HUES = Object.freeze([176, 44, 322, 262]);
const GREEN = '#43d86b';
const RED = '#ff5c7a';

const lastEntry = (match) => match.history[match.history.length - 1] ?? null;

const playerMood = (match) => {
  if (match.phase !== PHASE.FEEDBACK) return MOOD.IDLE;
  return lastEntry(match)?.correct ? MOOD.HAPPY : MOOD.SAD;
};

const rivalMood = (match) => {
  if (match.phase === PHASE.FEEDBACK) return lastEntry(match)?.rivalCorrect ? MOOD.HAPPY : MOOD.SAD;
  return match.phase === PHASE.PLAY && !match.rivalAnswered ? MOOD.THINK : MOOD.IDLE;
};

const drawScore = (ctx, value, x, y, pop, align) => {
  const size = 22 * (1 + pop * 0.35);
  drawText(ctx, String(value), x, y, size, { color: pop > 0 ? GOLD : '#ffffff', align });
};

const drawPanels = (ctx, frame) => {
  const { match, profile, strings, ui } = frame;
  const { player, rival } = MATCH;
  drawPillBox(ctx, player);
  drawPlayer(ctx, player.x + 31, player.y + 31, 23, { mood: playerMood(match), time: ui.time, frameId: profile.equipped.frame });
  drawText(ctx, strings.you, player.x + 62, player.y + 20, fitText(ctx, strings.you, 70, 12, 700), { weight: 700, align: 'left', color: '#f3e6ff', shadow: false });
  drawScore(ctx, match.playerScore, player.x + 62, player.y + 42, ui.popPlayer, 'left');

  drawPillBox(ctx, rival);
  drawRobot(ctx, rival.x + rival.w - 31, rival.y + 31, 23, { mood: rivalMood(match), time: ui.time });
  drawText(ctx, strings.rivalShort, rival.x + rival.w - 62, rival.y + 20, fitText(ctx, strings.rivalShort, 74, 12, 700), { weight: 700, align: 'right', color: AQUA, shadow: false });
  drawScore(ctx, match.rivalScore, rival.x + rival.w - 62, rival.y + 42, ui.popRival, 'right');
};

const drawRoundDots = (ctx, match, strings, time) => {
  drawText(ctx, strings.round, CX, 19, fitText(ctx, strings.round, 46, 10, 700), { weight: 700, color: '#d9c8ff', shadow: false });
  drawText(ctx, `${match.round + 1}/${match.questions.length}`, CX, 38, 19);
  match.questions.forEach((_, index) => {
    const entry = match.history[index];
    const current = index === match.round && !entry;
    ctx.fillStyle = entry ? (entry.correct ? GREEN : RED) : 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(CX - 20 + index * 10, 60, current ? 3.6 + Math.sin(time * 6) * 0.8 : 3.2, 0, TAU);
    ctx.fill();
  });
};

const drawRivalStatus = (ctx, match, strings, time) => {
  const { rival } = MATCH;
  const x = rival.x + rival.w - 8;
  if (match.phase === PHASE.PLAY) {
    const dots = '.'.repeat(1 + Math.floor(time * 3) % 3);
    const text = match.rivalAnswered ? strings.rivalAnswered : `${strings.rivalThinking}${dots}`;
    drawText(ctx, text, x, 86, 11, { weight: 700, align: 'right', color: match.rivalAnswered ? GOLD : '#d9c8ff', shadow: false });
  } else if (match.phase === PHASE.FEEDBACK) {
    const entry = lastEntry(match);
    drawText(ctx, `+${entry.rivalPoints}`, x, 86, 13, { align: 'right', color: entry.rivalCorrect ? GREEN : RED });
    drawText(ctx, `+${entry.points}`, MATCH.player.x + 8, 86, 13, { align: 'left', color: entry.correct ? GREEN : RED });
  }
};

const drawCentre = (ctx, frame) => {
  const { match, ui } = frame;
  const { vinyl } = MATCH;
  const playing = match.phase === PHASE.PLAY;
  const share = playing ? match.timeLeft / CONFIG.roundSeconds : match.phase === PHASE.READY ? 1 : 0;
  drawVinyl(ctx, vinyl.x, vinyl.y, vinyl.r, ui.spin, CATEGORY_HUE[match.category], playing ? ui.energy : 0);
  drawTimerRing(ctx, vinyl.x, vinyl.y, MATCH.ring, share, ui.time);
  if (playing) {
    const seconds = Math.ceil(match.timeLeft);
    const tick = 1 - (match.timeLeft % 1);
    drawText(ctx, String(seconds), vinyl.x, vinyl.y + 1, 26 * (1 + Math.max(0, 0.25 - tick) * (seconds <= 3 ? 1.6 : 0.6)), { color: seconds <= 3 ? '#ffd0d8' : '#ffffff' });
  }
};

// Faixa "Rodada N" antes de a melodia comecar.
const drawReady = (ctx, match, strings) => {
  const t = clamp01(match.t / 0.3);
  ctx.save();
  ctx.globalAlpha = easeOutCubic(t);
  ctx.translate(CX, MATCH.vinyl.y);
  ctx.scale(0.5 + 0.5 * easeOutBack(t), 0.5 + 0.5 * easeOutBack(t));
  drawHeadline(ctx, `${strings.round} ${match.round + 1}`, 0, 0, 40, GOLD, 300);
  ctx.restore();
  drawText(ctx, strings.getReady, CX, MATCH.prompt + 20, fitText(ctx, strings.getReady, 300, 17), { color: '#f3e6ff' });
};

const verdictOf = (match, strings) => {
  const entry = lastEntry(match);
  if (entry.pick === null) return { text: strings.timeUp, color: '#ffd0d8' };
  return entry.correct ? { text: strings.correct, color: '#b6ffcb' } : { text: strings.wrong, color: '#ffd0d8' };
};

// Depois da resposta: o veredito e o nome da melodia que tocou.
const drawReveal = (ctx, match, strings) => {
  const tune = tuneById(lastEntry(match).tuneId);
  const verdict = verdictOf(match, strings);
  const t = clamp01(match.t / 0.3);
  ctx.save();
  ctx.translate(CX, MATCH.vinyl.y);
  ctx.scale(0.5 + 0.5 * easeOutBack(t), 0.5 + 0.5 * easeOutBack(t));
  drawHeadline(ctx, verdict.text, 0, 0, 36, verdict.color, 300);
  ctx.restore();

  const box = MATCH.reveal;
  ctx.globalAlpha = easeOutCubic(t);
  roundRectPath(ctx, box.x, box.y, box.w, box.h, 18);
  ctx.fillStyle = 'rgba(18, 6, 46, 0.86)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 74, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const title = tuneTitle(tune, strings.lang);
  const composer = tune.composer ?? strings.traditional;
  drawText(ctx, strings.youHeard, CX, box.y + 15, 11, { weight: 700, color: '#d9c8ff', shadow: false });
  drawText(ctx, title, CX, box.y + 38, fitText(ctx, title, box.w - 24, 19), { color: GOLD });
  drawText(ctx, composer, CX, box.y + 60, fitText(ctx, composer, box.w - 24, 12, 600), { weight: 600, shadow: false });
  ctx.globalAlpha = 1;
};

// Cor do cartao conforme o momento: normal, certo (verde), escolha errada (vermelho) ou apagado.
const cardLook = (match, optionId, index) => {
  const hue = CARD_HUES[index % CARD_HUES.length];
  const normal = { top: '#ffffff', bottom: `hsl(${hue} 90% 90%)`, edge: `hsl(${hue} 60% 34%)`, badge: `hsl(${hue} 85% 46%)`, ink: INK, alpha: 1 };
  if (match.phase !== PHASE.FEEDBACK) return normal;
  const entry = lastEntry(match);
  if (optionId === entry.tuneId) return { top: '#c9ffd6', bottom: GREEN, edge: '#1b7a38', badge: '#1b7a38', ink: '#0c3319', alpha: 1 };
  if (optionId === entry.pick) return { top: '#ffd0d8', bottom: RED, edge: '#8f1f38', badge: '#8f1f38', ink: '#3d0915', alpha: 1 };
  return { ...normal, alpha: 0.4 };
};

const drawAnswerCard = (ctx, area, title, look, index, pressed) => {
  const drop = pressed ? 3 : 0;
  ctx.globalAlpha = look.alpha;
  roundRectPath(ctx, area.x, area.y + 5, area.w, area.h, 18);
  ctx.fillStyle = look.edge;
  ctx.fill();
  const fill = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
  fill.addColorStop(0, look.top);
  fill.addColorStop(1, look.bottom);
  roundRectPath(ctx, area.x, area.y + drop, area.w, area.h, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  const cy = area.y + area.h / 2 + drop;
  ctx.fillStyle = look.badge;
  ctx.beginPath();
  ctx.arc(area.x + 30, cy, 17, 0, TAU);
  ctx.fill();
  drawText(ctx, 'ABCD'[index], area.x + 30, cy + 0.5, 17, { shadow: false });
  const room = area.w - 72;
  drawText(ctx, title, area.x + 56 + room / 2, cy + 0.5, fitText(ctx, title, room, 17), { color: look.ink, shadow: false });
  ctx.globalAlpha = 1;
};

const drawCards = (ctx, frame) => {
  const { match, strings, ui } = frame;
  const question = currentQuestion(match);
  question.options.forEach((optionId, index) => {
    const area = MATCH.cards[index];
    const t = match.phase === PHASE.PLAY ? clamp01((match.t - index * 0.07) / 0.3) : 1;
    ctx.save();
    ctx.translate((1 - easeOutCubic(t)) * (index % 2 ? 60 : -60), 0);
    const look = cardLook(match, optionId, index);
    const title = tuneTitle(tuneById(optionId), strings.lang);
    drawAnswerCard(ctx, area, title, { ...look, alpha: look.alpha * easeOutCubic(t) }, index, ui.press?.key === `card:${index}`);
    ctx.restore();
  });
};

export const drawMatch = (ctx, frame) => {
  const { match, strings, ui } = frame;
  drawPanels(ctx, frame);
  drawRoundDots(ctx, match, strings, ui.time);
  drawRivalStatus(ctx, match, strings, ui.time);
  drawCentre(ctx, frame);
  if (match.phase === PHASE.READY) return drawReady(ctx, match, strings);
  if (match.phase === PHASE.PLAY) {
    const prompt = ui.needTap ? strings.tapForSound : strings.listen;
    drawText(ctx, prompt, CX, MATCH.prompt, fitText(ctx, prompt, 320, 16), { color: ui.needTap ? GOLD : '#f3e6ff' });
    drawEqualiser(ctx, MATCH.eq, ui.eq, ui.time);
  } else {
    drawReveal(ctx, match, strings);
  }
  return drawCards(ctx, frame);
};
