// Regras do jogo. Funcoes puras: recebem um estado e devolvem um novo, mais a lista do que aconteceu.
// Todo sorteio usa a semente guardada no estado, entao a mesma semente da sempre a mesma partida.
import { CONFIG, GRID, PHASE, TRAY_SIZE } from './config.js';
import { SHAPES } from './shapes.js';
import { nextInt, nextRandom, normalizeSeed } from './rng.js';

export const EVENT = Object.freeze({ PLACE: 'place', CLEAR: 'clear', DEAL: 'deal', OVER: 'over', REVIVE: 'revive' });

const LINE = Object.freeze(Array.from({ length: GRID }, (_, index) => index));
const NO_LINES = Object.freeze({ rows: Object.freeze([]), cols: Object.freeze([]) });

export const cellIndex = (col, row) => row * GRID + col;
export const emptyBoard = () => Array.from({ length: GRID * GRID }, () => 0);
const emptyTray = () => Array.from({ length: TRAY_SIZE }, () => null);

export const createState = (best = 0, seed = 1) => ({
  phase: PHASE.TITLE,
  board: emptyBoard(),
  tray: emptyTray(),
  score: 0,
  best,
  combo: 0,
  moves: 0,
  revived: false,
  seed: normalizeSeed(seed),
});

export const canPlace = (board, shape, col, row) =>
  Number.isInteger(col) && Number.isInteger(row) && shape.cells.every(([c, r]) => {
    const x = col + c;
    const y = row + r;
    return x >= 0 && x < GRID && y >= 0 && y < GRID && board[cellIndex(x, y)] === 0;
  });

export const fitsAnywhere = (board, shape) =>
  LINE.some((row) => LINE.some((col) => canPlace(board, shape, col, row)));

const stamp = (board, shape, col, row) => {
  const filled = new Set(shape.cells.map(([c, r]) => cellIndex(col + c, row + r)));
  return board.map((value, index) => (filled.has(index) ? shape.color : value));
};

export const fullLines = (board) => ({
  rows: LINE.filter((row) => LINE.every((col) => board[cellIndex(col, row)] !== 0)),
  cols: LINE.filter((col) => LINE.every((row) => board[cellIndex(col, row)] !== 0)),
});

// Linhas e colunas que fechariam se a peca fosse solta ali. Serve para o destaque durante o arrasto.
export const previewLines = (board, shape, col, row) =>
  (canPlace(board, shape, col, row) ? fullLines(stamp(board, shape, col, row)) : NO_LINES);

const inLines = (index, { rows, cols }) => rows.includes(Math.floor(index / GRID)) || cols.includes(index % GRID);

const cellsInLines = (board, lines) =>
  board
    .map((color, index) => ({ col: index % GRID, row: Math.floor(index / GRID), color }))
    .filter((cell, index) => cell.color !== 0 && inLines(index, lines));

const wipe = (board, lines) => board.map((value, index) => (inLines(index, lines) ? 0 : value));

const pickShape = (seed, pool) => {
  const roll = nextRandom(seed);
  const target = roll.value * pool.reduce((sum, shape) => sum + shape.weight, 0);
  const found = pool.reduce(
    (acc, shape) => (acc.shape || acc.sum + shape.weight <= target ? { ...acc, sum: acc.sum + shape.weight } : { shape, sum: acc.sum }),
    { shape: null, sum: 0 },
  ).shape;
  return { seed: roll.seed, shape: found ?? pool[pool.length - 1] };
};

// Sorteia a bandeja. Se nenhuma das tres couber no tabuleiro atual, troca uma por outra que caiba.
// Num tabuleiro vazio toda peca cabe, entao a bandeja inicial e sempre jogavel.
export const dealTray = (board, seed) => {
  const drawn = emptyTray().reduce((acc) => {
    const pick = pickShape(acc.seed, SHAPES);
    return { seed: pick.seed, tray: [...acc.tray, pick.shape.id] };
  }, { seed: normalizeSeed(seed), tray: [] });
  if (drawn.tray.some((id) => fitsAnywhere(board, SHAPES[id]))) return drawn;
  const fitting = SHAPES.filter((shape) => fitsAnywhere(board, shape));
  if (fitting.length === 0) return drawn;
  const pick = pickShape(drawn.seed, fitting);
  const slot = nextInt(pick.seed, TRAY_SIZE);
  return { seed: slot.seed, tray: drawn.tray.map((id, index) => (index === slot.value ? pick.shape.id : id)) };
};

// Verdadeiro quando nenhuma das pecas que restam na bandeja cabe no tabuleiro.
export const isStuck = (board, tray) =>
  !tray.some((id) => id !== null && fitsAnywhere(board, SHAPES[id]));

export const startRun = (state, seed = state.seed) => {
  const dealt = dealTray(emptyBoard(), seed);
  return { ...createState(state.best, dealt.seed), phase: PHASE.PLAY, tray: dealt.tray };
};

export const lineScore = (lines, combo) => CONFIG.pointsPerLine * lines * lines * Math.max(1, combo);

const resolveClear = (state, board, events) => {
  const lines = fullLines(board);
  const count = lines.rows.length + lines.cols.length;
  if (count === 0) return { board, combo: 0, points: 0 };
  const cleared = wipe(board, lines);
  const combo = state.combo + 1;
  const perfect = cleared.every((value) => value === 0);
  const points = lineScore(count, combo) + (perfect ? CONFIG.clearAllBonus : 0);
  events.push({ type: EVENT.CLEAR, ...lines, cells: cellsInLines(board, lines), lines: count, combo, points, perfect });
  return { board: cleared, combo, points };
};

const refill = (board, tray, seed, events) => {
  if (tray.some((id) => id !== null)) return { tray, seed };
  const dealt = dealTray(board, seed);
  events.push({ type: EVENT.DEAL, tray: dealt.tray });
  return dealt;
};

/**
 * Solta a peca da posicao `slot` da bandeja com o canto em (col, row).
 * Jogada invalida devolve o mesmo estado, sem eventos.
 * @returns {{state: object, events: object[]}}
 */
export const place = (state, slot, col, row) => {
  const id = state.phase === PHASE.PLAY ? state.tray[slot] ?? null : null;
  if (id === null || !canPlace(state.board, SHAPES[id], col, row)) return { state, events: [] };
  const shape = SHAPES[id];
  const gained = shape.cells.length * CONFIG.pointsPerCell;
  const events = [{
    type: EVENT.PLACE, slot, shape: id, col, row, color: shape.color, points: gained,
    cells: shape.cells.map(([c, r]) => ({ col: col + c, row: row + r })),
  }];
  const cleared = resolveClear(state, stamp(state.board, shape, col, row), events);
  const dealt = refill(cleared.board, state.tray.map((value, index) => (index === slot ? null : value)), state.seed, events);
  const score = Math.min(CONFIG.maxScore, state.score + gained + cleared.points);
  const next = {
    ...state, board: cleared.board, tray: dealt.tray, seed: dealt.seed, score, combo: cleared.combo, moves: state.moves + 1,
  };
  if (!isStuck(next.board, next.tray)) return { state: next, events };
  events.push({ type: EVENT.OVER, score });
  return { state: { ...next, phase: PHASE.OVER, best: Math.max(state.best, score) }, events };
};

const pickDistinct = (seed, count) =>
  Array.from({ length: Math.min(count, GRID) }).reduce((acc) => {
    const roll = nextInt(acc.seed, acc.pool.length);
    return {
      seed: roll.seed,
      picked: [...acc.picked, acc.pool[roll.value]],
      pool: acc.pool.filter((_, index) => index !== roll.value),
    };
  }, { seed, picked: [], pool: [...LINE] });

/**
 * Continua depois do fim de jogo: quebra linhas e colunas sorteadas e entrega uma bandeja nova.
 * Vale uma vez por partida; fora disso devolve o mesmo estado.
 * @returns {{state: object, events: object[]}}
 */
export const revive = (state) => {
  if (state.phase !== PHASE.OVER || state.revived) return { state, events: [] };
  const rows = pickDistinct(state.seed, CONFIG.reviveRows);
  const cols = pickDistinct(rows.seed, CONFIG.reviveCols);
  const lines = { rows: rows.picked, cols: cols.picked };
  const board = wipe(state.board, lines);
  const dealt = dealTray(board, cols.seed);
  const events = [
    { type: EVENT.REVIVE, ...lines, cells: cellsInLines(state.board, lines) },
    { type: EVENT.DEAL, tray: dealt.tray },
  ];
  return {
    state: { ...state, phase: PHASE.PLAY, board, tray: dealt.tray, seed: dealt.seed, combo: 0, revived: true },
    events,
  };
};
