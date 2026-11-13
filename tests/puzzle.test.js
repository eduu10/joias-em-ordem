import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, PHASE } from '../game/src/config.js';
import { applyMove, canMove, hasMoves, isJarDone, isSolved } from '../game/src/puzzle.js';
import { solve } from '../game/src/solver.js';
import { colorsFor, generateLevel } from '../game/src/levels.js';
import { EVENT, createSession, restart, tapJar, undo } from '../game/src/session.js';
import { parseSave, serializeSave } from '../game/src/save.js';
import { stringsFor } from '../game/src/strings.js';

const CAP = 4;
const replay = (jars, path) => path.reduce((state, { from, to }) => {
  assert.ok(canMove(state, from, to, CAP), `jogada invalida ${from}->${to}`);
  return applyMove(state, from, to);
}, jars);

test('canMove aceita pote vazio e mesma cor, recusa o resto', () => {
  const jars = [[0, 1], [1], [], [2, 2, 2, 2], [0]];
  assert.ok(canMove(jars, 0, 1, CAP));
  assert.ok(canMove(jars, 0, 2, CAP));
  assert.ok(!canMove(jars, 0, 4, CAP));
  assert.ok(!canMove(jars, 0, 3, CAP));
  assert.ok(!canMove(jars, 2, 0, CAP));
  assert.ok(!canMove(jars, 0, 0, CAP));
  assert.ok(!canMove(jars, 0, 9, CAP));
});

test('applyMove nao muta e move so o topo', () => {
  const jars = [[0, 1], [1], []];
  const snapshot = JSON.stringify(jars);
  assert.deepEqual(applyMove(jars, 0, 1), [[0], [1, 1], []]);
  assert.equal(JSON.stringify(jars), snapshot);
});

test('isJarDone, isSolved e hasMoves', () => {
  assert.ok(isJarDone([1, 1, 1, 1], CAP));
  assert.ok(!isJarDone([1, 1, 1], CAP));
  assert.ok(isSolved([[0, 0, 0, 0], [], [1, 1, 1, 1]], CAP));
  assert.ok(!isSolved([[0, 0, 0], [0], []], CAP));
  assert.ok(!hasMoves([[0, 1, 0, 1], [1, 0, 1, 0]], CAP));
  assert.ok(hasMoves([[0, 1, 0, 1], []], CAP));
});

test('solver resolve um caso simples e devolve jogadas validas', () => {
  const jars = [[0, 1, 0, 1], [1, 0, 1, 0], [], []];
  const path = solve(jars, CAP, 10000);
  assert.ok(path);
  assert.ok(isSolved(replay(jars, path), CAP));
});

test('solver devolve null para estado sem saida', () => {
  assert.equal(solve([[0, 1, 0, 1], [1, 0, 1, 0]], CAP, 10000), null);
});

test('quantidade de cores cresce com a fase e respeita o teto', () => {
  assert.equal(colorsFor(1), 2);
  assert.equal(colorsFor(2), 3);
  assert.ok(colorsFor(10) > colorsFor(2));
  assert.equal(colorsFor(5000), CONFIG.maxColors);
});

test('as 60 primeiras fases tem solucao, sao deterministicas e bem formadas', () => {
  for (let level = 1; level <= 60; level += 1) {
    const generated = generateLevel(level);
    assert.ok(generated.solvable, `fase ${level} sem solucao encontrada`);
    assert.deepEqual(generateLevel(level).jars, generated.jars);
    assert.equal(generated.jars.length, colorsFor(level) + CONFIG.emptyJars);
    assert.ok(!isSolved(generated.jars, generated.capacity));
    const counts = generated.jars.flat().reduce((map, color) => map.set(color, (map.get(color) ?? 0) + 1), new Map());
    assert.equal(counts.size, colorsFor(level));
    assert.ok([...counts.values()].every((count) => count === generated.capacity));
    const path = solve(generated.jars, generated.capacity, CONFIG.solverNodeLimit);
    assert.ok(isSolved(replay(generated.jars, path), generated.capacity));
  }
});

test('fase alta (teto de cores) e gerada rapido', () => {
  const started = performance.now();
  assert.ok(generateLevel(400).solvable);
  assert.ok(performance.now() - started < 1500);
});

test('toque seleciona, troca a selecao, desmarca e move', () => {
  const session = createSession(1, [[0, 1], [1], [], [2, 2, 2, 2]], CAP);
  const picked = tapJar(session, 0);
  assert.equal(picked.event.type, EVENT.SELECT);
  assert.equal(tapJar(picked.session, 0).event.type, EVENT.DESELECT);
  assert.equal(tapJar(session, 2).event.type, EVENT.NONE);
  assert.equal(tapJar(session, 3).event.type, EVENT.NONE);

  const moved = tapJar(picked.session, 1);
  assert.equal(moved.event.type, EVENT.MOVE);
  assert.deepEqual(moved.session.jars, [[0], [1, 1], [], [2, 2, 2, 2]]);
  assert.equal(moved.session.moves, 1);
  assert.equal(moved.session.selected, null);
  assert.deepEqual(moved.event, { type: EVENT.MOVE, from: 0, to: 1, color: 1, fromSlot: 1, toSlot: 1, jarDone: false, won: false });
  assert.deepEqual(session.jars, [[0, 1], [1], [], [2, 2, 2, 2]]);
});

test('alvo invalido com gemas vira a nova selecao', () => {
  const picked = tapJar(createSession(1, [[0, 1], [0, 0], []], CAP), 0).session;
  const result = tapJar(picked, 1);
  assert.equal(result.event.type, EVENT.SELECT);
  assert.equal(result.session.selected, 1);
});

test('ultima jogada vence, avisa o pote completo e trava novas jogadas', () => {
  const session = createSession(3, [[0, 0, 0], [0], []], CAP);
  const won = tapJar(tapJar(session, 1).session, 0);
  assert.equal(won.session.phase, PHASE.WON);
  assert.ok(won.event.won && won.event.jarDone);
  assert.equal(tapJar(won.session, 0).event.type, EVENT.NONE);
  assert.equal(undo(won.session), won.session);
});

test('desfazer volta um passo e reiniciar volta ao comeco', () => {
  const start = createSession(1, [[0, 1], [1], []], CAP);
  const moved = tapJar(tapJar(start, 0).session, 1).session;
  const undone = undo(moved);
  assert.deepEqual(undone.jars, start.jars);
  assert.equal(undone.history.length, 0);
  assert.equal(undo(start), start);
  const fresh = restart(moved);
  assert.deepEqual(fresh.jars, start.jars);
  assert.equal(fresh.moves, 0);
});

test('save faz ida e volta e tolera dado invalido ou antigo', () => {
  assert.deepEqual(parseSave(serializeSave({ level: 12, hints: 2 })), { level: 12, hints: 2 });
  const fresh = { level: 1, hints: CONFIG.startingHints };
  for (const raw of ['', null, undefined, 'lixo', '[]', 'null', '{"version":1,"best":9}']) {
    assert.deepEqual(parseSave(raw), fresh);
  }
  assert.deepEqual(parseSave('{"level":-3,"hints":"x"}'), fresh);
  assert.deepEqual(parseSave('{"level":7.9,"hints":0}'), { level: 7, hints: 0 });
  assert.deepEqual(parseSave('{"level":4,"hints":1e9}'), { level: 4, hints: 999 });
});

test('idioma desconhecido cai para ingles', () => {
  assert.equal(stringsFor('pt-BR').next, 'Próxima fase');
  assert.equal(stringsFor('ja-JP').next, 'Next level');
  assert.equal(stringsFor(undefined).next, 'Next level');
});
