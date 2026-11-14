// Tela inicial (titulo animado e roda de criancas), painel de fim de partida e aviso de som desligado. So desenha.
import { CONFIG } from './config.js';
import { HOME, OVER } from './layout.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack } from './ease.js';
import { drawButton } from './widgets.js';

const TAU = Math.PI * 2;
const SKIN = Object.freeze(['#f2c9a0', '#c98b5e', '#8d5a3b', '#e8b48a', '#6e4129', '#f5d3b3', '#a86f48', '#d9a173']);
const CLOTHES = Object.freeze(['#ff5a5f', '#ffc93c', '#3ec300', '#2e9bff', '#ff7fd1', '#ff8c2e', '#a46bff', '#2ad1c9']);
const KIDS = 8;

const kidAt = (i, time) => {
  const angle = time * 0.6 + (i / KIDS) * TAU;
  return { x: 180 + Math.cos(angle) * 112, y: 352 + Math.sin(angle) * 30, depth: Math.sin(angle), i, angle };
};

const drawKid = (ctx, kid, time) => {
  const s = 0.8 + 0.25 * (kid.depth + 1) / 2;
  const hop = Math.abs(Math.sin(time * 4 + kid.i)) * 5;
  ctx.save();
  ctx.translate(kid.x, kid.y - hop);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 26 + hop / s, 12, 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3a1a10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, 14);
  ctx.lineTo(-5, 26);
  ctx.moveTo(4, 14);
  ctx.lineTo(5, 26);
  ctx.stroke();
  ctx.fillStyle = CLOTHES[kid.i];
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(11, 16);
  ctx.lineTo(-11, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SKIN[kid.i];
  ctx.beginPath();
  ctx.arc(0, -14, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2b140b';
  ctx.beginPath();
  ctx.arc(0, -17, 8, Math.PI, TAU);
  ctx.fill();
  ctx.restore();
};

// Roda de criancas de maos dadas girando: quem esta mais perto e desenhado por ultimo.
const drawRing = (ctx, time) => {
  const kids = Array.from({ length: KIDS }, (_, i) => kidAt(i, time));
  ctx.strokeStyle = 'rgba(255, 220, 180, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  kids.forEach((kid, i) => {
    const next = kids[(i + 1) % KIDS];
    ctx.moveTo(kid.x, kid.y - 2);
    ctx.lineTo(next.x, next.y - 2);
  });
  ctx.stroke();
  [...kids].sort((a, b) => a.depth - b.depth).forEach((kid) => drawKid(ctx, kid, time));
};

// Balao de festa (de papel, enfeite) subindo devagar.
const drawLantern = (ctx, x, y, hue, time) => {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.3 + hue) * 6);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  glow.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.45)`);
  glow.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(-30, -30, 60, 60);
  ctx.fillStyle = `hsl(${hue} 90% 60%)`;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(14, -10, 9, 12);
  ctx.lineTo(-9, 12);
  ctx.quadraticCurveTo(-14, -10, 0, -18);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(-9, -2, 18, 3);
  ctx.fillStyle = '#ffdf6b';
  ctx.fillRect(-4, 12, 8, 4);
  ctx.restore();
};

const drawTitle = (ctx, strings, time) => {
  drawText(ctx, strings.title1, 180, 150, 26, { color: '#ffe9c4' });
  const word = strings.title2;
  ctx.font = '900 54px system-ui, sans-serif';
  const total = ctx.measureText(word).width;
  let x = 180 - total / 2;
  [...word].forEach((letter, i) => {
    const w = ctx.measureText(letter).width;
    const bounce = Math.max(0, Math.sin(time * 3 - i * 0.5)) * 10;
    const hue = [12, 40, 330, 190, 110, 280, 24, 50][i % 8];
    ctx.save();
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 16;
    drawText(ctx, letter, x + w / 2, 204 - bounce, 54, { color: `hsl(${hue} 100% 70%)`, weight: 900 });
    ctx.restore();
    x += w;
  });
  drawText(ctx, strings.tagline, 180, 250, fitText(ctx, strings.tagline, 320, 15, 600), { weight: 600, color: '#fff1d0' });
};

const floatingNotes = (ctx, time) => {
  for (let i = 0; i < 6; i += 1) {
    const t = (time * 0.18 + i / 6) % 1;
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.8;
    drawText(ctx, i % 2 ? '♪' : '♫', 40 + i * 56 + Math.sin(time + i) * 10, 300 - t * 200, 18 + (i % 3) * 4, { color: '#ffe6a0' });
  }
  ctx.globalAlpha = 1;
};

export const drawHome = (ctx, frame) => {
  const { strings, ui, save, today } = frame;
  floatingNotes(ctx, ui.time);
  drawLantern(ctx, 48, 296, 18, ui.time);
  drawLantern(ctx, 314, 286, 48, ui.time + 1);
  drawTitle(ctx, strings, ui.time);
  drawRing(ctx, ui.time);
  const pressed = (key) => ui.press?.key === key;
  drawButton(ctx, HOME.run, strings.playRun, { pressed: pressed('run'), size: 26 });
  const dailyPlayed = save.dailyDate === today;
  drawButton(ctx, HOME.daily, dailyPlayed ? strings.dailyDone : strings.playDaily, {
    pressed: pressed('daily'), color: dailyPlayed ? '#9a7bb0' : '#3fb4ff', dark: dailyPlayed ? '#5c4470' : '#1d6fb3', size: 20,
    sub: dailyPlayed ? `${save.dailyScore} ${strings.pts}` : '',
  });
  const stats = `${strings.best}: ${save.best} ${strings.pts}  ·  ${strings.level} ${save.bestLevel}`;
  drawText(ctx, stats, 180, 612, fitText(ctx, stats, 320, 13, 700), { weight: 700, color: '#ffe9c4' });
};

export const drawOver = (ctx, frame) => {
  const { game, strings, ui, bounds, save } = frame;
  const t = ui.overT;
  ctx.fillStyle = `rgba(20, 6, 30, ${Math.min(0.75, t * 2)})`;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const pop = easeOutBack(clamp01(t * 2.5));
  ctx.save();
  ctx.translate(180, 300);
  ctx.scale(pop, pop);
  roundRectPath(ctx, -150, -190, 300, 276, 26);
  ctx.fillStyle = '#3a1450';
  ctx.fill();
  ctx.strokeStyle = '#ffcf6b';
  ctx.lineWidth = 3;
  ctx.stroke();
  const daily = game.mode === 'daily';
  drawText(ctx, daily ? strings.dailyTitle : strings.overTitle, 0, -150, 28, { color: '#ffd45c' });
  drawText(ctx, strings.score, 0, -100, 16, { weight: 700, color: '#ffe9c4' });
  drawText(ctx, `${game.score}`, 0, -60, 52, { color: '#fff' });
  if (game.score > 0 && game.score >= save.best) drawText(ctx, strings.newBest, 0, -18, 18, { color: '#7dff8e' });
  const line = `${strings.best}: ${save.best}  ·  ${strings.level} ${game.level}`;
  drawText(ctx, line, 0, 14, fitText(ctx, line, 260, 14, 700), { weight: 700, color: '#ffe9c4' });
  if (daily) drawText(ctx, strings.dailyPlayed, 0, 46, fitText(ctx, strings.dailyPlayed, 260, 13, 600), { weight: 600, color: '#d9c8ff' });
  ctx.restore();
  if (t < 0.4) return;
  const pressed = (key) => ui.press?.key === key;
  if (frame.canRevive) {
    drawButton(ctx, OVER.primary, strings.reviveAd, { pressed: pressed('revive'), color: '#ffb02e', dark: '#c26a0a', size: 17 });
    drawButton(ctx, OVER.secondary, strings.playAgain, { pressed: pressed('again'), size: 19 });
  } else if (!daily) {
    drawButton(ctx, OVER.primary, strings.playAgain, { pressed: pressed('again'), size: 22 });
  }
  drawButton(ctx, OVER.home, strings.home, { pressed: pressed('home'), color: '#8a6aa8', dark: '#55396e', size: 16 });
};

export const drawMuted = (ctx, frame) => {
  const { strings, bounds, ui } = frame;
  ctx.fillStyle = 'rgba(16, 4, 26, 0.9)';
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  const y = 270 + Math.sin(ui.time * 2) * 4;
  ctx.fillStyle = '#ffd45c';
  ctx.beginPath();
  ctx.moveTo(150, y - 12);
  ctx.lineTo(164, y - 12);
  ctx.lineTo(184, y - 30);
  ctx.lineTo(184, y + 30);
  ctx.lineTo(164, y + 12);
  ctx.lineTo(150, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd45c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  [16, 28].forEach((r, i) => {
    ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(ui.time * 3 - i));
    ctx.beginPath();
    ctx.arc(188, y, r, -0.7, 0.7);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
  drawText(ctx, strings.mutedTitle, 180, 350, fitText(ctx, strings.mutedTitle, 320, 26), { color: '#ffd45c' });
  drawText(ctx, strings.mutedLine1, 180, 392, fitText(ctx, strings.mutedLine1, 320, 15, 600), { weight: 600 });
  drawText(ctx, strings.mutedLine2, 180, 418, fitText(ctx, strings.mutedLine2, 320, 15, 600), { weight: 600, color: '#e3d2ff' });
};

export const OVER_INPUT_DELAY = CONFIG.introSeconds * 0.6;
