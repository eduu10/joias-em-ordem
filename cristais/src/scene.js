// Monta um quadro inteiro a partir do estado. Nao altera nada.
import { FEEL, PHASE } from './config.js';
import { canPlace, fitsAnywhere, previewLines } from './logic.js';
import { SHAPES, gemColor } from './shapes.js';
import { dropCell, heldPose, mixPose, trayPose } from './layout.js';
import { clamp01, easeOutCubic } from './ease.js';
import { drawAmbient } from './ambient.js';
import { drawGhost, drawLineGlow, drawPiece, drawTiles, drawTray } from './board.js';
import { drawFx } from './fx.js';
import { drawCaption, drawHud } from './hud.js';
import { drawOverCard, drawTitle } from './cards.js';
import { drawText } from './draw.js';

const NO_LINES = Object.freeze({ rows: [], cols: [] });
const HINT_Y = 616;
const TOAST_Y = 80;
const HINT_MOVES = 8;

// O que o arrasto atual significa: peca, pose desenhada, casa de encaixe e linhas que quebrariam.
const readDrag = (state, ui) => {
  const shape = ui.drag ? SHAPES[state.tray[ui.drag.slot]] : null;
  if (!shape) return null;
  const cell = dropCell(shape, ui.drag);
  const valid = canPlace(state.board, shape, cell.col, cell.row);
  return {
    shape, cell, valid,
    pose: heldPose(shape, ui.drag),
    lines: valid ? previewLines(state.board, shape, cell.col, cell.row) : NO_LINES,
  };
};

const hintFor = (state, ui, strings) => {
  if (state.phase !== PHASE.PLAY || state.revived) return '';
  if (state.moves === 0) return strings.hint;
  return !ui.cleared && state.moves < HINT_MOVES ? strings.hintLines : '';
};

const drawBoardLayer = (ctx, frame, drag) => {
  const { state, ui } = frame;
  const over = state.phase === PHASE.OVER;
  const lines = drag ? drag.lines : NO_LINES;
  const willClear = lines.rows.length + lines.cols.length > 0;
  if (willClear) drawLineGlow(ctx, lines, gemColor(drag.shape.color), ui.time);
  drawTiles(ctx, state.board, {
    time: ui.time,
    pops: ui.pops,
    lines,
    lineColor: willClear ? gemColor(drag.shape.color) : null,
    dim: over ? clamp01(ui.overT / 0.5) : 0,
  });
  if (drag && drag.valid) drawGhost(ctx, drag.shape, drag.cell.col, drag.cell.row, ui.time);
};

const drawTrayLayer = (ctx, frame) => {
  const { state, ui } = frame;
  const busySlot = (slot) => (ui.drag && ui.drag.slot === slot) || (ui.back && ui.back.slot === slot);
  const pieces = state.tray.map((id, slot) => (id === null || busySlot(slot) ? null : SHAPES[id]));
  const playing = state.phase !== PHASE.OVER;
  drawTray(ctx, pieces, {
    time: ui.time,
    dealT: ui.dealT,
    playable: pieces.map((shape) => Boolean(shape) && playing && fitsAnywhere(state.board, shape)),
  });
};

// Peca na mao do jogador, ou voltando para a bandeja depois de uma jogada invalida.
const drawHeld = (ctx, frame, drag) => {
  const { state, ui } = frame;
  if (drag) drawPiece(ctx, drag.shape, drag.pose, { shadow: 1, glow: 0.5 });
  const shape = ui.back ? SHAPES[state.tray[ui.back.slot]] : null;
  if (!shape) return;
  const pose = mixPose(ui.back.from, trayPose(ui.back.slot), easeOutCubic(clamp01(ui.back.t / FEEL.returnSeconds)));
  drawPiece(ctx, shape, pose, { shadow: 0.5 });
};

export const drawLoading = (ctx, view, strings) => {
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  ctx.fillStyle = '#0b0a1f';
  ctx.fillRect(0, 0, view.width, view.height);
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, Math.min(view.width, view.height) * 0.05, { color: '#9be8ff' });
};

const drawOverlays = (ctx, frame, bounds) => {
  const { state, strings, ui } = frame;
  if (state.phase === PHASE.TITLE) {
    drawTitle(ctx, bounds, strings, state.best, ui.time);
    return;
  }
  drawHud(ctx, { score: ui.shown, best: state.best, combo: state.combo, pop: ui.scorePop, time: ui.time }, strings);
  drawCaption(ctx, hintFor(state, ui, strings), HINT_Y, 0.75 + 0.25 * Math.sin(ui.time * 3));
  if (state.phase === PHASE.OVER) {
    drawOverCard(ctx, bounds, {
      score: state.score, best: state.best, newBest: state.score > 0 && state.score >= state.best, canRevive: !state.revived,
    }, strings, ui.overT - FEEL.overCardDelay);
  }
  const { toast } = ui;
  drawCaption(ctx, toast?.text, TOAST_Y, toast ? Math.min(1, toast.t * 6, (FEEL.toastSeconds - toast.t) * 3) : 0);
};

// `frame`: { state, view, world, strings, ui }
export const drawScene = (ctx, frame) => {
  const { view, world, ui } = frame;
  const shake = ui.shake * FEEL.shakePixels;
  const sx = Math.sin(ui.time * 70) * shake;
  const sy = Math.cos(ui.time * 55) * shake;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shake > 0) {
    ctx.fillStyle = '#05040f';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  const k = view.ratio * view.scale;
  ctx.drawImage(world.canvas, sx * k, sy * k);
  ctx.setTransform(k, 0, 0, k, (view.ox + sx * view.scale) * view.ratio, (view.oy + sy * view.scale) * view.ratio);
  const bounds = { x: -view.ox / view.scale - 10, y: -view.oy / view.scale - 10, w: view.width / view.scale + 20, h: view.height / view.scale + 20 };

  const drag = readDrag(frame.state, ui);
  drawAmbient(ctx, world, bounds, ui.time);
  drawBoardLayer(ctx, frame, drag);
  drawTrayLayer(ctx, frame);
  drawFx(ctx, ui.fx);
  drawHeld(ctx, frame, drag);
  drawOverlays(ctx, frame, bounds);
};
