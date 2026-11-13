// Geometria do arrasto: onde fica cada peca na bandeja, na mao do jogador e em que casa ela encaixa.
// Uma "pose" e o centro da peca e o tamanho de cada casa: { x, y, cell }.
import { BOARD, FEEL, TRAY } from './config.js';
import { clamp01, easeOutCubic, lerp } from './ease.js';

export const cellCenter = (col, row) => ({
  x: BOARD.x + (col + 0.5) * BOARD.cell,
  y: BOARD.y + (row + 0.5) * BOARD.cell,
});

export const slotAt = (x, y) => {
  if (y < TRAY.top || y > TRAY.bottom + 20) return -1;
  return TRAY.slots.findIndex((center) => Math.abs(x - center) <= TRAY.halfWidth);
};

export const trayPose = (slot) => ({ x: TRAY.slots[slot], y: TRAY.y, cell: TRAY.cell });

// A peca fica acima do dedo para nao ser escondida por ele.
export const dragPose = (shape, x, y) => ({
  x,
  y: y - FEEL.liftPixels - (shape.h * BOARD.cell) / 2,
  cell: BOARD.cell,
});

export const mixPose = (from, to, t) => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
  cell: lerp(from.cell, to.cell, t),
});

// Pose desenhada durante o arrasto: sai da bandeja e cresce ate o tamanho do tabuleiro.
export const heldPose = (shape, drag) =>
  mixPose(trayPose(drag.slot), dragPose(shape, drag.x, drag.y), easeOutCubic(clamp01(drag.t / FEEL.liftSeconds)));

// Casa do tabuleiro onde o canto de cima a esquerda da peca encaixa.
export const snapCell = (shape, pose) => ({
  col: Math.round((pose.x - (shape.w * BOARD.cell) / 2 - BOARD.x) / BOARD.cell),
  row: Math.round((pose.y - (shape.h * BOARD.cell) / 2 - BOARD.y) / BOARD.cell),
});

// Casa onde a peca cairia se fosse solta agora (usa a pose final, nao a animada).
export const dropCell = (shape, drag) => snapCell(shape, dragPose(shape, drag.x, drag.y));
