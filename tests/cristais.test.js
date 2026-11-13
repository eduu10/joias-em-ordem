import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, GRID, PHASE, TRAY_SIZE } from '../cristais/src/config.js';
import { SHAPES } from '../cristais/src/shapes.js';
import { nextInt, nextRandom } from '../cristais/src/rng.js';
import {
  EVENT, canPlace, cellIndex, createState, dealTray, emptyBoard, fitsAnywhere, fullLines, isStuck, lineScore, place,
  previewLines, revive, startRun,
} from '../cristais/src/logic.js';
import { parseSave, serializeSave } from '../cristais/src/save.js';
import { stringsFor } from '../cristais/src/strings.js';

const shapeId = (family, w = null) => SHAPES.find((shape) => shape.family === family && (w === null || shape.w === w)).id;
const DOT = shapeId('dot');
const DUO_H = shapeId('duo', 2);
const I4_H = shapeId('i4', 4);
const I4_V = shapeId('i4', 1);
const O3 = shapeId('o3');

// Tabuleiro a partir de linhas de texto: '#' e casa ocupada.
const boardFrom = (rows) => emptyBoard().map((_, index) => (rows[Math.floor(index / GRID)]?.[index % GRID] === '#' ? 1 : 0));
const playing = (board, tray, extra = {}) => ({ ...createState(), phase: PHASE.PLAY, board, tray, ...extra });
const count = (board) => board.filter((value) => value !== 0).length;

test('pecas: conjunto variado, normalizado e com cor propria por familia', () => {
  assert.ok(SHAPES.length >= 20);
  const families = new Set(SHAPES.map((shape) => shape.family));
  ['dot', 'duo', 'i3', 'i4', 'i5', 'o2', 'o3', 'corner', 'l', 'j', 't', 's', 'z'].forEach((name) => assert.ok(families.has(name), name));
  assert.equal(new Set(SHAPES.map((shape) => shape.color)).size, families.size);
  SHAPES.forEach((shape, index) => {
    assert.equal(shape.id, index);
    assert.equal(Math.min(...shape.cells.map(([col]) => col)), 0);
    assert.equal(Math.min(...shape.cells.map(([, row]) => row)), 0);
    assert.equal(new Set(shape.cells.map(([col, row]) => `${col},${row}`)).size, shape.cells.length);
    assert.ok(shape.w <= 5 && shape.h <= 5 && shape.weight > 0);
  });
  const keys = SHAPES.map((shape) => JSON.stringify(shape.cells));
  assert.equal(new Set(keys).size, keys.length, 'orientacoes repetidas');
});

test('canPlace respeita as bordas e casas ocupadas', () => {
  const board = boardFrom(['', '..#']);
  const line = SHAPES[I4_H];
  assert.ok(canPlace(board, line, 0, 0));
  assert.ok(canPlace(board, line, 4, 7));
  assert.ok(!canPlace(board, line, 5, 0));
  assert.ok(!canPlace(board, line, -1, 0));
  assert.ok(!canPlace(board, line, 0, 8));
  assert.ok(!canPlace(board, line, 0, -1));
  assert.ok(!canPlace(board, line, 0, 1));
  assert.ok(canPlace(board, line, 3, 1));
  assert.ok(!canPlace(board, SHAPES[I4_V], 2, 0));
  assert.ok(!canPlace(board, line, 0.5, 0));
  assert.ok(!canPlace(board, line, NaN, 0));
});

test('place nao muta o estado recebido e pontua por casa', () => {
  const state = playing(emptyBoard(), [I4_H, DOT, DOT]);
  const snapshot = JSON.stringify(state);
  const { state: after, events } = place(state, 0, 2, 3);
  assert.equal(JSON.stringify(state), snapshot);
  assert.notEqual(after, state);
  assert.equal(count(after.board), 4);
  [2, 3, 4, 5].forEach((col) => assert.equal(after.board[cellIndex(col, 3)], SHAPES[I4_H].color));
  assert.deepEqual(after.tray, [null, DOT, DOT]);
  assert.equal(after.score, 4 * CONFIG.pointsPerCell);
  assert.equal(after.moves, 1);
  assert.deepEqual(events.map((event) => event.type), [EVENT.PLACE]);
  assert.equal(events[0].cells.length, 4);
});

test('jogada invalida devolve o mesmo estado', () => {
  const state = playing(boardFrom(['#']), [I4_H, null, DOT]);
  assert.equal(place(state, 0, 0, 0).state, state);
  assert.equal(place(state, 0, 6, 0).state, state);
  assert.equal(place(state, 1, 3, 3).state, state);
  assert.equal(place(state, 9, 3, 3).state, state);
  assert.equal(place({ ...state, phase: PHASE.TITLE }, 2, 3, 3).events.length, 0);
  assert.equal(place({ ...state, phase: PHASE.OVER }, 2, 3, 3).state.phase, PHASE.OVER);
});

test('linha completa some e so ela', () => {
  const state = playing(boardFrom(['####....', '#']), [I4_H, DOT, DOT]);
  const { state: after, events } = place(state, 0, 4, 0);
  assert.equal(count(after.board), 1);
  assert.equal(after.board[cellIndex(0, 1)], 1);
  const clear = events.find((event) => event.type === EVENT.CLEAR);
  assert.deepEqual(clear.rows, [0]);
  assert.deepEqual(clear.cols, []);
  assert.equal(clear.cells.length, GRID);
  assert.equal(clear.lines, 1);
});

test('coluna completa some', () => {
  const state = playing(boardFrom(['#', '#', '#', '#', '', '', '', '', ]).map((v, i) => (i === 1 ? 1 : v)), [I4_V, DOT, DOT]);
  const { state: after, events } = place(state, 0, 0, 4);
  assert.equal(count(after.board), 1);
  assert.equal(after.board[1], 1);
  assert.deepEqual(events.find((event) => event.type === EVENT.CLEAR).cols, [0]);
});

test('linha e coluna ao mesmo tempo: a casa do cruzamento conta uma vez', () => {
  const rows = ['.#######', '#', '#', '#', '#', '#', '#', '#'];
  const state = playing(boardFrom(rows), [DOT, DOT, DOT]);
  assert.deepEqual(previewLines(state.board, SHAPES[DOT], 0, 0), { rows: [0], cols: [0] });
  assert.deepEqual(previewLines(state.board, SHAPES[DOT], 3, 3), { rows: [], cols: [] });
  const { state: after, events } = place(state, 0, 0, 0);
  const clear = events.find((event) => event.type === EVENT.CLEAR);
  assert.equal(clear.lines, 2);
  assert.equal(clear.cells.length, 15);
  assert.equal(count(after.board), 0);
  assert.ok(clear.perfect);
  assert.equal(after.score, CONFIG.pointsPerCell + lineScore(2, 1) + CONFIG.clearAllBonus);
});

test('pontuacao: varias linhas valem mais e o combo cresce em jogadas seguidas', () => {
  assert.ok(lineScore(2, 1) > 2 * lineScore(1, 1));
  assert.ok(lineScore(1, 3) > lineScore(1, 2));
  const rows = ['.#######', '.#######', '.#######', '', '', '', '', '#'];
  let state = playing(boardFrom(rows), [DOT, DOT, DOT]);
  let result = place(state, 0, 0, 0);
  assert.equal(result.state.combo, 1);
  assert.equal(result.state.score, 1 + lineScore(1, 1));
  state = result.state;
  result = place(state, 1, 0, 1);
  assert.equal(result.state.combo, 2);
  assert.equal(result.events.find((event) => event.type === EVENT.CLEAR).combo, 2);
  assert.equal(result.state.score, state.score + 1 + lineScore(1, 2));
  // Uma jogada sem quebrar nada zera o combo.
  const broken = place({ ...result.state, tray: [null, null, DOT, ] }, 2, 5, 5).state;
  assert.equal(broken.combo, 0);
  const miss = place(playing(emptyBoard(), [DOT, DOT, DOT], { combo: 4 }), 0, 0, 0).state;
  assert.equal(miss.combo, 0);
});

test('a bandeja e reposta depois de tres jogadas', () => {
  let state = startRun(createState(0, 7), 7);
  assert.equal(state.tray.length, TRAY_SIZE);
  const seen = [];
  for (let slot = 0; slot < TRAY_SIZE; slot += 1) {
    assert.ok(state.tray.every((id, index) => (index < slot ? id === null : id !== null)));
    const shape = SHAPES[state.tray[slot]];
    const spot = Array.from({ length: GRID * GRID }, (_, i) => [i % GRID, Math.floor(i / GRID)])
      .find(([col, row]) => canPlace(state.board, shape, col, row));
    const result = place(state, slot, spot[0], spot[1]);
    seen.push(result.events.some((event) => event.type === EVENT.DEAL));
    state = result.state;
  }
  assert.deepEqual(seen, [false, false, true]);
  assert.ok(state.tray.every((id) => Number.isInteger(id) && SHAPES[id]));
});

test('fim de jogo: detecta quando nada cabe e nao acusa quando ainda cabe', () => {
  const full = Array.from({ length: GRID }, (_, row) => (row % 2 ? '#.#.#.#.' : '.#.#.#.#'));
  const checker = boardFrom(full);
  assert.ok(isStuck(checker, [DUO_H, O3, null]));
  assert.ok(!isStuck(checker, [DUO_H, DOT, null]));
  assert.ok(isStuck(checker, [null, null, null]));
  assert.ok(!isStuck(emptyBoard(), [O3, null, null]));

  const { state: over, events } = place(playing(checker, [DOT, DUO_H, O3], { best: 3, score: 40 }), 0, 0, 0);
  assert.equal(over.phase, PHASE.OVER);
  assert.equal(events.at(-1).type, EVENT.OVER);
  assert.equal(over.best, 41);
  assert.equal(place(over, 1, 0, 0).state, over);

  const alive = place(playing(checker, [DOT, DOT, O3]), 0, 0, 0).state;
  assert.equal(alive.phase, PHASE.PLAY);
  assert.equal(place(playing(checker, [DOT, null, null], { best: 500 }), 0, 0, 0).state.best, 500);
});

test('sorteio: a mesma semente da a mesma bandeja, e num tabuleiro vazio sempre da para jogar', () => {
  assert.deepEqual(dealTray(emptyBoard(), 42), dealTray(emptyBoard(), 42));
  assert.deepEqual(nextRandom(5), nextRandom(5));
  const used = new Set();
  for (let seed = 0; seed < 600; seed += 1) {
    const { tray, seed: next } = dealTray(emptyBoard(), seed * 7919);
    assert.equal(tray.length, TRAY_SIZE);
    assert.ok(Number.isInteger(next));
    tray.forEach((id) => {
      used.add(id);
      assert.ok(fitsAnywhere(emptyBoard(), SHAPES[id]));
    });
    assert.ok(!isStuck(emptyBoard(), tray));
    const roll = nextInt(seed, 8).value;
    assert.ok(roll >= 0 && roll < 8);
  }
  assert.equal(used.size, SHAPES.length, 'toda peca aparece em algum sorteio');
  SHAPES.forEach((shape) => assert.ok(fitsAnywhere(emptyBoard(), shape)));
});

test('sorteio prefere entregar ao menos uma peca que caiba no tabuleiro atual', () => {
  const tight = boardFrom(Array.from({ length: GRID }, (_, row) => (row % 2 ? '#.#.#.#.' : '.#.#.#.#')));
  for (let seed = 1; seed < 300; seed += 1) {
    const { tray } = dealTray(tight, seed);
    assert.ok(!isStuck(tight, tray), `semente ${seed}`);
  }
});

// Jogador automatico: escolhe ao acaso entre todas as jogadas validas.
const randomMove = (state, seed) => {
  const moves = state.tray.flatMap((id, slot) => (id === null ? [] : Array.from({ length: GRID * GRID }, (_, i) => ({
    slot, col: i % GRID, row: Math.floor(i / GRID),
  })).filter(({ col, row }) => canPlace(state.board, SHAPES[id], col, row))));
  const roll = nextInt(seed, Math.max(1, moves.length));
  return { move: moves[roll.value] ?? null, seed: roll.seed };
};

const playGame = (seed, useRevive) => {
  let state = startRun(createState(0, seed), seed);
  let botSeed = seed + 99;
  let revived = false;
  for (let turn = 0; turn < 5000; turn += 1) {
    if (state.phase === PHASE.OVER) {
      if (!useRevive || revived) break;
      state = revive(state).state;
      revived = true;
      assert.equal(state.phase, PHASE.PLAY);
    }
    const pick = randomMove(state, botSeed);
    botSeed = pick.seed;
    assert.ok(pick.move, 'em jogo sem nenhuma jogada valida');
    const before = state;
    const result = place(state, pick.move.slot, pick.move.col, pick.move.row);
    assert.notEqual(result.state, before);
    assert.ok(result.state.score > before.score);
    state = result.state;
  }
  return state;
};

test('200 partidas automaticas terminam num fim de jogo valido', () => {
  let total = 0;
  let longest = 0;
  for (let game = 0; game < 200; game += 1) {
    const state = playGame(1000 + game * 31, game % 4 === 0);
    assert.equal(state.phase, PHASE.OVER, `partida ${game} nao terminou`);
    assert.ok(isStuck(state.board, state.tray));
    assert.ok(state.tray.some((id) => id !== null));
    assert.equal(state.board.length, GRID * GRID);
    assert.ok(state.board.every((value) => Number.isInteger(value) && value >= 0));
    assert.deepEqual(fullLines(state.board), { rows: [], cols: [] });
    assert.ok(Number.isInteger(state.score) && state.score > 0);
    assert.equal(state.best, state.score);
    total += state.moves;
    longest = Math.max(longest, state.moves);
  }
  assert.ok(total / 200 > 8, 'partidas curtas demais');
  console.log(`  media de ${(total / 200).toFixed(1)} jogadas, maior partida ${longest}`);
});

test('continuar: quebra 3 linhas e 3 colunas, entrega bandeja jogavel e vale uma vez', () => {
  const checker = boardFrom(Array.from({ length: GRID }, (_, row) => (row % 2 ? '#.#.#.#.' : '.#.#.#.#')));
  const over = place(playing(checker, [DOT, DUO_H, O3], { score: 40 }), 0, 0, 0).state;
  const snapshot = JSON.stringify(over);
  const { state: back, events } = revive(over);
  assert.equal(JSON.stringify(over), snapshot);
  assert.equal(back.phase, PHASE.PLAY);
  assert.ok(back.revived);
  assert.equal(back.score, over.score);
  assert.equal(back.combo, 0);
  const event = events.find((item) => item.type === EVENT.REVIVE);
  assert.equal(new Set(event.rows).size, CONFIG.reviveRows);
  assert.equal(new Set(event.cols).size, CONFIG.reviveCols);
  event.rows.forEach((row) => assert.ok(back.board.slice(row * GRID, row * GRID + GRID).every((value) => value === 0)));
  event.cols.forEach((col) => assert.ok(back.board.every((value, index) => index % GRID !== col || value === 0)));
  assert.equal(count(over.board) - count(back.board), event.cells.length);
  assert.ok(back.tray.every((id) => id !== null));
  assert.ok(!isStuck(back.board, back.tray));
  assert.ok(events.some((item) => item.type === EVENT.DEAL));

  const again = { ...back, phase: PHASE.OVER };
  assert.equal(revive(again).state, again);
  assert.equal(revive(back).state, back);
  assert.equal(startRun(again, 5).revived, false);
});

test('startRun guarda o recorde e zera o resto', () => {
  const state = startRun({ ...createState(77, 3), score: 12, combo: 2 }, 9);
  assert.equal(state.best, 77);
  assert.equal(state.score, 0);
  assert.equal(state.phase, PHASE.PLAY);
  assert.equal(count(state.board), 0);
  assert.deepEqual(startRun(createState(0, 1), 9).tray, state.tray);
  assert.equal(createState().phase, PHASE.TITLE);
});

test('save faz ida e volta e tolera dado invalido', () => {
  assert.deepEqual(parseSave(serializeSave(1234)), { best: 1234 });
  for (const raw of ['', null, undefined, 42, {}, 'lixo', '[]', 'null', '{"best":-2}', '{"best":"x"}', '{"best":null}', '{"best":1e999}']) {
    assert.deepEqual(parseSave(raw), { best: 0 });
  }
  assert.deepEqual(parseSave('{"best":7.8}'), { best: 7 });
  assert.deepEqual(parseSave('{"best":"15"}'), { best: 15 });
  assert.deepEqual(parseSave('{"best":1e30}'), { best: CONFIG.maxScore });
});

test('textos: portugues, ingles e ingles como reserva, com as mesmas chaves', () => {
  assert.equal(stringsFor('pt-BR').playAgain, 'Jogar de novo');
  assert.equal(stringsFor('en-US').playAgain, 'Play again');
  assert.equal(stringsFor('PT').title, stringsFor('pt').title);
  [undefined, null, '', 'ja-JP', 42].forEach((tag) => assert.equal(stringsFor(tag), stringsFor('en')));
  assert.deepEqual(Object.keys(stringsFor('pt')).sort(), Object.keys(stringsFor('en')).sort());
  assert.equal(stringsFor('pt').multi.length, stringsFor('en').multi.length);
});
