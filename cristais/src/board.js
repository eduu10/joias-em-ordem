// Cristais do tabuleiro, pecas da bandeja, a sombra de encaixe e o destaque das linhas que vao quebrar.
import { BOARD, FEEL, GRID } from './config.js';
import { hsl, roundRectPath } from './draw.js';
import { clamp01, easeOutBack } from './ease.js';
import { drawGem, drawSparkle } from './gem.js';
import { gemColor } from './shapes.js';
import { trayPose } from './layout.js';

const TWINKLE_PERIOD = 6;

const noise = (index) => {
  const value = Math.sin(index * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const popOf = (pops, index) => {
  const pop = pops.find((item) => item.index === index);
  return pop ? clamp01(pop.t / FEEL.popSeconds) : 1;
};

const inLines = (index, lines) =>
  lines.rows.includes(Math.floor(index / GRID)) || lines.cols.includes(index % GRID);

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[]} board casas do tabuleiro (0 e vazio)
 * @param {{time: number, pops: object[], lines: object, lineColor: number[]|null, dim: number}} look
 */
export const drawTiles = (ctx, board, look) => {
  const pulse = 0.5 + 0.5 * Math.sin(look.time * 9);
  board.forEach((colorId, index) => {
    if (colorId === 0) return;
    const x = BOARD.x + (index % GRID) * BOARD.cell;
    const y = BOARD.y + Math.floor(index / GRID) * BOARD.cell;
    const k = popOf(look.pops, index);
    const marked = look.lineColor && inLines(index, look.lines);
    drawGem(ctx, x, y, BOARD.cell, marked ? look.lineColor : gemColor(colorId), {
      scale: 0.55 + 0.45 * easeOutBack(k),
      squash: Math.sin(k * Math.PI) * 0.1,
      flash: (1 - k) * 0.7 + (marked ? 0.04 + pulse * 0.14 : 0),
      alpha: 1 - look.dim * 0.45,
    });
    const phase = (look.time + noise(index) * TWINKLE_PERIOD) % TWINKLE_PERIOD;
    if (phase < 0.5 && look.dim === 0) {
      const blink = Math.sin((phase / 0.5) * Math.PI);
      drawSparkle(ctx, x + BOARD.cell * 0.27, y + BOARD.cell * 0.27, BOARD.cell * 0.2 * blink, blink);
    }
  });
};

// Luz sobre as linhas e colunas que vao quebrar se a peca for solta.
export const drawLineGlow = (ctx, lines, color, time) => {
  const pulse = 0.5 + 0.5 * Math.sin(time * 9);
  const rects = [
    ...lines.rows.map((row) => [BOARD.x, BOARD.y + row * BOARD.cell, BOARD.size, BOARD.cell]),
    ...lines.cols.map((col) => [BOARD.x + col * BOARD.cell, BOARD.y, BOARD.cell, BOARD.size]),
  ];
  rects.forEach(([x, y, w, h]) => {
    roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, 9);
    ctx.fillStyle = hsl(color, 14, 0.16 + pulse * 0.12);
    ctx.fill();
    ctx.strokeStyle = hsl(color, 26, 0.55 + pulse * 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
  });
};

/**
 * Desenha uma peca inteira centrada na pose { x, y, cell }.
 * @param {{alpha?: number, glow?: number, shadow?: number, flash?: number, scale?: number}} options
 */
export const drawPiece = (ctx, shape, pose, options = {}) => {
  const { alpha = 1, glow = 0, shadow = 0, flash = 0, scale = 1 } = options;
  const cell = pose.cell * scale;
  if (cell <= 0.5 || alpha <= 0) return;
  const left = pose.x - (shape.w * cell) / 2;
  const top = pose.y - (shape.h * cell) / 2;
  if (shadow > 0 && cell > 6) {
    ctx.fillStyle = `rgba(2, 1, 10, ${0.35 * shadow})`;
    shape.cells.forEach(([col, row]) => {
      roundRectPath(ctx, left + col * cell + 2, top + row * cell + 6 + shadow * 8, cell - 2, cell - 2, cell * 0.2);
      ctx.fill();
    });
  }
  const color = gemColor(shape.color);
  shape.cells.forEach(([col, row]) => {
    drawGem(ctx, left + col * cell, top + row * cell, cell, color, { alpha, glow, flash });
  });
};

// Marca translucida nas casas onde a peca vai encaixar.
export const drawGhost = (ctx, shape, col, row, time) => {
  const color = gemColor(shape.color);
  const pulse = 0.5 + 0.5 * Math.sin(time * 7);
  shape.cells.forEach(([c, r]) => {
    const x = BOARD.x + (col + c) * BOARD.cell;
    const y = BOARD.y + (row + r) * BOARD.cell;
    drawGem(ctx, x, y, BOARD.cell, color, { alpha: 0.38 + pulse * 0.1 });
    roundRectPath(ctx, x + 2, y + 2, BOARD.cell - 4, BOARD.cell - 4, 7);
    ctx.strokeStyle = hsl(color, 28, 0.75);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
};

/**
 * @param {Array<object|null>} pieces peca de cada posicao (ou null), ja sem a que esta na mao
 * @param {{time: number, dealT: number, playable: boolean[]}} look
 */
export const drawTray = (ctx, pieces, look) => {
  pieces.forEach((shape, slot) => {
    if (!shape) return;
    const enter = clamp01((look.dealT - slot * FEEL.dealStagger) / FEEL.dealSeconds);
    const pose = trayPose(slot);
    const bob = Math.sin(look.time * 2.2 + slot * 1.9) * 1.6;
    const fits = look.playable[slot];
    drawPiece(ctx, shape, { ...pose, y: pose.y + bob + (1 - enter) * 26 }, {
      scale: Math.max(0, easeOutBack(enter)),
      alpha: (fits ? 1 : 0.34) * Math.min(1, enter * 3),
      shadow: fits ? 0.5 : 0,
    });
  });
};
