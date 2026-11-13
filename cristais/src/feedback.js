// Traduz o que aconteceu nas regras em animacao e som. Funcoes puras sobre o estado visual (`ui`).
import { BOARD, DESIGN, FEEL, GRID, PHASE } from './config.js';
import { EVENT, cellIndex } from './logic.js';
import { gemColor } from './shapes.js';
import { cellCenter } from './layout.js';
import { beam, dyingTile, floatText, ring, shards, stepFx } from './fx.js';

const SHARDS_PER_TILE = 5;
const CENTER = Object.freeze({ col: (GRID - 1) / 2, row: (GRID - 1) / 2 });
const GOLD = '#ffe08a';
const CYAN = '#9be8ff';
const PINK = '#ff9be6';

export const EMPTY_UI = Object.freeze({
  drag: null, back: null, pops: [], fx: [], shake: 0, scorePop: 0, shown: 0, dealT: 0, overT: 0,
  toast: null, origin: CENTER, cleared: false,
});

const withFx = (ui, items) => ({ ...ui, fx: [...ui.fx, ...items].slice(-FEEL.maxFx) });

const middle = (cells) => ({
  col: cells.reduce((sum, cell) => sum + cell.col, 0) / cells.length,
  row: cells.reduce((sum, cell) => sum + cell.row, 0) / cells.length,
});

// Cristais quebram em onda, a partir de onde a peca caiu.
const shatter = (event, origin) => {
  const tiles = event.cells.flatMap((cell) => {
    const delay = Math.hypot(cell.col - origin.col, cell.row - origin.row) * FEEL.clearStagger;
    const { x, y } = cellCenter(cell.col, cell.row);
    const color = gemColor(cell.color);
    return [dyingTile(cell.col, cell.row, color, delay), ...shards(x, y, color, SHARDS_PER_TILE, delay + FEEL.tileSeconds * 0.4)];
  });
  const tint = gemColor(event.cells[0]?.color ?? 3);
  const beams = [
    ...event.rows.map((row) => beam(BOARD.x, BOARD.y + row * BOARD.cell, BOARD.size, BOARD.cell, tint)),
    ...event.cols.map((col) => beam(BOARD.x + col * BOARD.cell, BOARD.y, BOARD.cell, BOARD.size, tint)),
  ];
  return [...beams, ...tiles];
};

const clearTexts = (event, strings) => {
  const spot = event.cells.length ? middle(event.cells) : CENTER;
  const center = cellCenter(spot.col, spot.row);
  const x = Math.min(DESIGN.w - 80, Math.max(80, center.x));
  const y = Math.max(BOARD.y + 50, center.y);
  const label = strings.multi[Math.min(event.lines, strings.multi.length - 1)];
  return [
    floatText(x, y, `+${event.points}`, { size: 22 + Math.min(12, event.lines * 3), color: GOLD }),
    ...(label ? [floatText(x, y - 32, label, { size: 20, color: CYAN, delay: 0.08 })] : []),
    ...(event.combo >= 2 ? [floatText(x, y + 30, `${strings.combo} x${event.combo}!`, { size: 19, color: PINK, delay: 0.16, max: 1.3 })] : []),
    ...(event.perfect ? [floatText(DESIGN.w / 2, BOARD.y + BOARD.size / 2, strings.perfect, { size: 26, color: '#ffffff', delay: 0.3, max: 1.6 })] : []),
  ];
};

const onPlace = (ui, event) => ({
  ui: {
    ...ui,
    origin: middle(event.cells),
    scorePop: 1,
    pops: [...ui.pops, ...event.cells.map((cell) => ({ index: cellIndex(cell.col, cell.row), t: 0 }))],
  },
  sounds: [['place', 0]],
});

const onClear = (ui, event, strings) => {
  const center = cellCenter(ui.origin.col, ui.origin.row);
  const next = withFx(ui, [
    ...shatter(event, ui.origin),
    ring(center.x, center.y, gemColor(event.cells[0]?.color ?? 3)),
    ...clearTexts(event, strings),
  ]);
  const shake = event.lines >= 2 ? Math.min(1, event.lines * FEEL.shakePerLine) : 0;
  return {
    ui: { ...next, shake: Math.max(ui.shake, shake), cleared: true },
    sounds: [
      ['clear', Math.min(12, (event.combo - 1) * 2)],
      ['shard', 0],
      ...(event.lines >= 2 ? [['multi', Math.min(7, (event.lines - 2) * 2)]] : []),
    ],
  };
};

const onRevive = (ui, event, strings) => ({
  ui: {
    ...withFx(ui, [
      ...shatter(event, CENTER),
      floatText(DESIGN.w / 2, BOARD.y + BOARD.size / 2, strings.revived, { size: 24, color: CYAN, max: 1.5 }),
    ]),
    shake: 0.8,
    overT: 0,
  },
  sounds: [['revive', 0], ['shard', 0]],
});

/**
 * @param {object} ui estado visual atual
 * @param {object} event evento vindo das regras
 * @param {object} strings textos do idioma
 * @returns {{ui: object, sounds: Array<[string, number]>}}
 */
export const applyEvent = (ui, event, strings) => {
  switch (event.type) {
    case EVENT.PLACE: return onPlace(ui, event);
    case EVENT.CLEAR: return onClear(ui, event, strings);
    case EVENT.REVIVE: return onRevive(ui, event, strings);
    case EVENT.DEAL: return { ui: { ...ui, dealT: 0 }, sounds: [] };
    case EVENT.OVER: return { ui: { ...ui, overT: 0, drag: null, back: null }, sounds: [['over', 0]] };
    default: return { ui, sounds: [] };
  }
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);

// Avanca todos os relogios das animacoes. `state` so e lido.
export const stepUi = (ui, dt, state) => {
  const gap = state.score - ui.shown;
  return {
    ...ui,
    time: ui.time + dt,
    fx: stepFx(ui.fx, dt),
    pops: ui.pops.map((pop) => ({ ...pop, t: pop.t + dt })).filter((pop) => pop.t < FEEL.popSeconds),
    shake: fade(ui.shake, dt, 2.6),
    scorePop: fade(ui.scorePop, dt, 4),
    shown: Math.abs(gap) < 0.5 ? state.score : ui.shown + gap * Math.min(1, dt * FEEL.scoreCatchUp),
    dealT: ui.dealT + dt,
    overT: state.phase === PHASE.OVER ? ui.overT + dt : 0,
    toast: advance(ui.toast, dt, FEEL.toastSeconds),
    drag: ui.drag ? { ...ui.drag, t: ui.drag.t + dt } : null,
    back: advance(ui.back, dt, FEEL.returnSeconds),
  };
};
