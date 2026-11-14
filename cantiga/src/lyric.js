// Letra no estilo karaoke: silaba atual acesa, bolinha quicando e a palavra escondida como lacuna brilhante.
import { CONFIG, PHASE } from './config.js';
import { songById } from './songs.js';
import { LYRIC } from './layout.js';
import { drawText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, lerp } from './ease.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SPACE = 8;
const BLANK_MIN = 86;
const MIN_SIZE = 14;
const layoutCache = new Map();

const font = (size) => `800 ${Math.round(size)}px ${FONT}`;

// Quebra as palavras ate a escondida em linhas centralizadas. Guarda o centro de cada silaba.
const buildLayout = (ctx, song, stopWord, size) => {
  const lineHeight = Math.round(size * 2);
  ctx.font = font(size);
  const items = song.words.slice(0, stopWord + 1).map((word, index) => {
    const notes = song.notes.slice(word.first, word.last + 1);
    const widths = notes.map((note) => ctx.measureText(note.syl).width);
    const textWidth = widths.reduce((a, b) => a + b, 0);
    const blank = index === stopWord;
    const answerWidth = ctx.measureText(word.label).width;
    return { index, notes, widths, w: blank ? Math.max(BLANK_MIN, answerWidth + 18) : textWidth, blank };
  });
  const lines = [];
  let line = [];
  let lineW = 0;
  items.forEach((item) => {
    const add = (line.length ? SPACE : 0) + item.w;
    if (line.length && lineW + add > LYRIC.w) {
      lines.push({ items: line, w: lineW });
      line = [];
      lineW = 0;
    }
    lineW += (line.length ? SPACE : 0) + item.w;
    line.push(item);
  });
  if (line.length) lines.push({ items: line, w: lineW });
  const top = LYRIC.y + (LYRIC.h - lines.length * lineHeight) / 2 + lineHeight / 2;
  const sylCenters = new Map();
  const placed = lines.flatMap((row, r) => {
    let x = LYRIC.x + (LYRIC.w - row.w) / 2;
    const y = top + r * lineHeight;
    return row.items.map((item) => {
      const at = { ...item, x, y };
      let sx = x;
      item.notes.forEach((note, k) => {
        const noteIndex = song.words[item.index].first + k;
        const w = item.blank ? item.w / item.notes.length : item.widths[k];
        sylCenters.set(noteIndex, { x: sx + w / 2, y, sx, w });
        sx += w;
      });
      x += item.w + SPACE;
      return at;
    });
  });
  return { placed, sylCenters, size, fits: lines.length * lineHeight <= LYRIC.h };
};

const layoutFor = (ctx, song, stopWord) => {
  const key = `${song.id}:${stopWord}`;
  if (!layoutCache.has(key)) {
    // Letra longa: diminui a fonte ate caber no painel.
    let layout = buildLayout(ctx, song, stopWord, LYRIC.size);
    for (let size = LYRIC.size - 1; !layout.fits && size >= MIN_SIZE; size -= 1) layout = buildLayout(ctx, song, stopWord, size);
    layoutCache.set(key, layout);
  }
  return layoutCache.get(key);
};

// Indice da nota sendo cantada no instante `lt` (segundos desde o inicio do trecho).
const noteAt = (song, lt) => {
  let current = -1;
  song.notes.forEach((note, i) => { if (note.start <= lt) current = i; });
  return current;
};

const drawBlank = (ctx, item, game, time, size) => {
  const { round, phase } = game;
  const label = songById(round.songId).words[item.index].label;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  const x = item.x;
  const y = item.y;
  if (phase === PHASE.REVEAL) {
    const pop = easeOutBack(clamp01(game.t * 3.2));
    const color = round.right ? '#fff27a' : '#ffb3a8';
    ctx.save();
    ctx.translate(x + item.w / 2, y);
    ctx.scale(pop, pop);
    ctx.shadowColor = round.right ? 'rgba(255, 230, 90, 0.9)' : 'rgba(255, 110, 90, 0.7)';
    ctx.shadowBlur = 18;
    drawText(ctx, label, 0, 0, size, { color });
    ctx.restore();
    return;
  }
  const glow = phase === PHASE.ASK ? 0.55 + 0.45 * pulse : 0.25;
  ctx.save();
  ctx.shadowColor = `rgba(255, 220, 110, ${glow})`;
  ctx.shadowBlur = 16;
  roundRectPath(ctx, x, y - size * 0.7, item.w, size * 1.4, 10);
  ctx.fillStyle = `rgba(255, 214, 102, ${0.12 + 0.18 * glow})`;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = `rgba(255, 236, 160, ${0.6 + 0.4 * glow})`;
  ctx.fillRect(x + 8, y + size * 0.4, item.w - 16, 3);
  drawText(ctx, '?', x + item.w / 2, y - 1, size * 0.87, { color: `rgba(255, 240, 190, ${0.4 + 0.6 * glow})` });
};

const drawWord = (ctx, item, current, sung, size) => {
  let sx = item.x;
  ctx.font = font(size);
  item.notes.forEach((note, k) => {
    const noteIndex = sung.first + k;
    const done = sung.all || noteIndex < current;
    const now = !sung.all && noteIndex === current;
    const color = now ? '#ffffff' : done ? '#ffd45c' : 'rgba(255, 238, 214, 0.55)';
    if (now) {
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 14;
      drawText(ctx, note.syl, sx, item.y - 2, size * 1.06, { color, align: 'left' });
      ctx.restore();
    } else {
      drawText(ctx, note.syl, sx, item.y, size, { color, align: 'left' });
    }
    sx += item.widths[k];
  });
};

const drawBall = (ctx, x, y, time) => {
  ctx.save();
  ctx.shadowColor = 'rgba(255, 210, 80, 0.9)';
  ctx.shadowBlur = 12;
  const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
  grad.addColorStop(0, '#fffbe0');
  grad.addColorStop(1, '#ff9f1c');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 6 + Math.sin(time * 10) * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Posicao da bolinha: quica de uma silaba para a proxima no ritmo das notas.
const ballPosition = (song, layout, game, lt) => {
  const stopFirst = song.words[game.round.word].first;
  if (game.phase !== PHASE.LISTEN || lt < 0) {
    const target = game.phase === PHASE.LISTEN ? layout.sylCenters.get(0) : layout.sylCenters.get(stopFirst);
    return { x: target.x, y: target.y - layout.size - Math.abs(Math.sin(game.t * 5)) * 10 };
  }
  const current = Math.max(0, noteAt(song, lt));
  const note = song.notes[current];
  const from = layout.sylCenters.get(current);
  const to = layout.sylCenters.get(Math.min(current + 1, stopFirst)) ?? from;
  const f = clamp01((lt - note.start) / note.seconds);
  const sameLine = Math.abs(from.y - to.y) < 1;
  const x = sameLine ? lerp(from.x, to.x, f) : from.x;
  const baseY = from.y - layout.size;
  return { x, y: baseY - Math.sin(f * Math.PI) * layout.size * 0.6 };
};

export const drawLyric = (ctx, game, time) => {
  const song = songById(game.round.songId);
  const layout = layoutFor(ctx, song, game.round.word);
  const lt = game.phase === PHASE.LISTEN ? game.t - CONFIG.introSeconds : Infinity;
  const current = game.phase === PHASE.LISTEN ? noteAt(song, lt) : -1;
  layout.placed.forEach((item) => {
    if (item.blank) drawBlank(ctx, item, game, time, layout.size);
    else drawWord(ctx, item, current, { first: song.words[item.index].first, all: game.phase !== PHASE.LISTEN }, layout.size);
  });
  if (game.phase !== PHASE.REVEAL) {
    const ball = ballPosition(song, layout, game, lt);
    drawBall(ctx, ball.x, ball.y, time);
  }
};
