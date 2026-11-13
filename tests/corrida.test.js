import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTION, CONFIG, HALF_DEPTH, ITEM, KIND, LANES, PHASE } from '../corrida/src/config.js';
import { createRng } from '../corrida/src/rng.js';
import { droneLane, generateSegment } from '../corrida/src/patterns.js';
import { difficultyAt, gapAt } from '../corrida/src/speed.js';
import {
  EVENT, act, createState, hits, isSliding, revive, scoreOf, speedAt, startRun, step, touches,
} from '../corrida/src/sim.js';
import { parseSave, serializeSave } from '../corrida/src/save.js';
import { stringsFor } from '../corrida/src/strings.js';

const DT = 1 / 60;
const FAR = 1e9;

// Pista vazia (sem geracao automatica) com os obstaculos e itens dados.
const lab = (extra = {}) => ({ ...startRun(createState(), 7), nextZ: FAR, ...extra });
const press = (state, action) => act(state, action).state;
const obstacle = (kind, lane, z, more = {}) => ({ id: z, kind, lane, z, ...more });
const coin = (lane, z, h = CONFIG.coinHeight) => ({ id: z, type: ITEM.COIN, lane, z, h });

// Avanca ate a distancia pedida. `plan` pode devolver um novo estado (comandos) a cada passo.
const runTo = (start, meters, plan = (state) => state) => {
  let state = start;
  const events = [];
  for (let i = 0; i < 200000 && state.phase === PHASE.RUN && state.distance < meters; i += 1) {
    const result = step(plan(state), DT);
    state = result.state;
    events.push(...result.events);
  }
  return { state, events };
};

const secondsTo = (state, z) => (z - state.distance) / speedAt(state.distance);
const jumpAt = (z) => (state) =>
  (!state.airborne && Math.abs(secondsTo(state, z) - CONFIG.jumpSeconds / 2) < DT ? press(state, ACTION.JUMP) : state);
const slideAt = (z) => (state) =>
  (!isSliding(state) && Math.abs(secondsTo(state, z) - 0.25) < DT ? press(state, ACTION.SLIDE) : state);

// Jogador automatico: olha a proxima fileira, vai para a faixa mais facil e pula ou desliza na hora certa.
const botTurn = (state) => {
  const ahead = state.obstacles.filter((o) => o.z + 1.6 > state.distance);
  if (ahead.length === 0) return state;
  const rowZ = Math.min(...ahead.map((o) => o.z));
  const row = ahead.filter((o) => o.z - rowZ < 1);
  const cost = [0, 1, 2].map((lane) => {
    const here = row.filter((o) => (o.kind === KIND.DRONE ? lane >= o.a && lane <= o.b : o.lane === lane));
    if (here.some((o) => o.kind === KIND.BLOCK || o.kind === KIND.DRONE)) return Infinity;
    return (here.length ? 1 : 0) + Math.abs(lane - state.lane) * 0.1;
  });
  const target = cost.indexOf(Math.min(...cost));
  let next = state;
  if (target !== next.lane) next = press(next, target < next.lane ? ACTION.LEFT : ACTION.RIGHT);
  const cell = row.find((o) => o.kind !== KIND.DRONE && o.lane === target);
  const seconds = secondsTo(next, rowZ);
  if (cell?.kind === KIND.LOW && !next.airborne && seconds < CONFIG.jumpSeconds / 2 && seconds > -0.05) {
    next = press(next, ACTION.JUMP);
  }
  if (cell?.kind === KIND.HIGH && seconds < 0.3 && next.slideT < 0.3) next = press(next, ACTION.SLIDE);
  return next;
};

test('troca de faixa fica presa nas 3 faixas e o robo desliza ate a faixa nova', () => {
  let state = lab();
  assert.equal(state.lane, 1);
  state = press(press(press(state, ACTION.LEFT), ACTION.LEFT), ACTION.LEFT);
  assert.equal(state.lane, 0);
  assert.equal(act(state, ACTION.LEFT).events[0].type, EVENT.BUMP);
  assert.equal(act(state, ACTION.LEFT).state, state);
  for (let i = 0; i < 5; i += 1) state = press(state, ACTION.RIGHT);
  assert.equal(state.lane, LANES - 1);
  // Dois toques rapidos valem os dois: a faixa alvo muda na hora, a posicao acompanha suave.
  const moved = step(state, DT).state;
  assert.ok(moved.x > 1 && moved.x < 2, `x=${moved.x}`);
  assert.equal(runTo(state, 10).state.x, 2);
  assert.equal(act(createState(), ACTION.LEFT).state.lane, 1, 'fora da corrida nao aceita comando');
});

test('pulo: sobe, chega perto da altura configurada e pousa no tempo certo', () => {
  let state = press(lab(), ACTION.JUMP);
  assert.ok(state.airborne);
  let peak = 0;
  let seconds = 0;
  const seen = [];
  while (state.airborne) {
    const result = step(state, DT);
    state = result.state;
    seen.push(...result.events.map((event) => event.type));
    peak = Math.max(peak, state.y);
    seconds += DT;
  }
  assert.ok(Math.abs(peak - CONFIG.jumpHeight) < 0.12, `pico ${peak}`);
  assert.ok(Math.abs(seconds - CONFIG.jumpSeconds) < 0.05, `duracao ${seconds}`);
  assert.equal(state.y, 0);
  assert.ok(seen.includes(EVENT.LAND));
});

test('pulo no ar fica guardado e sai ao pousar; se demorar, e esquecido', () => {
  let state = press(lab(), ACTION.JUMP);
  for (let i = 0; i < 4; i += 1) state = step(state, DT).state;
  const early = press(state, ACTION.JUMP);
  assert.equal(runTo(early, 3).state.airborne, true);
  let late = early;
  while (late.airborne) late = step(late, DT).state;
  assert.equal(late.buffer, null, 'pulo guardado cedo demais expira');

  // Perto do chao o segundo pulo emenda no primeiro.
  while (state.y > 0.25 || state.vy > 0) state = step(state, DT).state;
  state = press(state, ACTION.JUMP);
  assert.ok(state.buffer);
  let jumps = 0;
  for (let i = 0; i < 10; i += 1) {
    const result = step(state, DT);
    state = result.state;
    jumps += result.events.filter((event) => event.type === EVENT.JUMP).length;
  }
  assert.equal(jumps, 1);
  assert.ok(state.airborne && state.y > 0);
});

test('deslizar dura o tempo configurado, pular cancela e no ar vira queda rapida', () => {
  let state = press(lab(), ACTION.SLIDE);
  assert.ok(isSliding(state));
  let seconds = 0;
  while (isSliding(state)) { state = step(state, DT).state; seconds += DT; }
  assert.ok(Math.abs(seconds - CONFIG.slideSeconds) < 0.03, `duracao ${seconds}`);

  const cancelled = press(press(lab(), ACTION.SLIDE), ACTION.JUMP);
  assert.ok(cancelled.airborne && !isSliding(cancelled));

  let diving = press(lab(), ACTION.JUMP);
  for (let i = 0; i < 12; i += 1) diving = step(diving, DT).state;
  diving = press(diving, ACTION.SLIDE);
  assert.ok(diving.vy <= -CONFIG.fastFallSpeed);
  let ticks = 0;
  while (diving.airborne) { diving = step(diving, DT).state; ticks += 1; }
  assert.ok(ticks * DT < 0.2, 'queda rapida');
  assert.ok(isSliding(diving), 'chega ao chao deslizando');
});

test('barreira baixa: bate correndo ou deslizando, passa pulando ou em outra faixa', () => {
  const start = lab({ obstacles: [obstacle(KIND.LOW, 1, 20)] });
  assert.equal(runTo(start, 30).state.phase, PHASE.OVER);
  assert.equal(runTo(start, 30, slideAt(20)).state.phase, PHASE.OVER);
  assert.equal(runTo(start, 30, jumpAt(20)).state.phase, PHASE.RUN);
  assert.equal(runTo(press(start, ACTION.LEFT), 30).state.phase, PHASE.RUN);
});

test('viga alta: bate correndo ou pulando, passa deslizando ou em outra faixa', () => {
  const start = lab({ obstacles: [obstacle(KIND.HIGH, 1, 20)] });
  assert.equal(runTo(start, 30).state.phase, PHASE.OVER);
  assert.equal(runTo(start, 30, jumpAt(20)).state.phase, PHASE.OVER);
  assert.equal(runTo(start, 30, slideAt(20)).state.phase, PHASE.RUN);
  assert.equal(runTo(press(start, ACTION.RIGHT), 30).state.phase, PHASE.RUN);
});

test('bloco: so passa trocando de faixa', () => {
  const start = lab({ obstacles: [obstacle(KIND.BLOCK, 1, 20)] });
  const crash = runTo(start, 30);
  assert.equal(crash.state.phase, PHASE.OVER);
  assert.ok(crash.state.distance < 20, 'para antes de atravessar o bloco');
  assert.deepEqual(crash.events.slice(-2).map((event) => event.type), [EVENT.CRASH, EVENT.OVER]);
  assert.equal(runTo(start, 30, jumpAt(20)).state.phase, PHASE.OVER);
  assert.equal(runTo(start, 30, slideAt(20)).state.phase, PHASE.OVER);
  assert.equal(runTo(press(start, ACTION.LEFT), 30).state.phase, PHASE.RUN);
  assert.equal(step(crash.state, DT).state, crash.state, 'depois de bater nada mais anda');
});

test('drone: vai e volta entre duas faixas e so a terceira e segura', () => {
  assert.equal(droneLane(0, 1, 0), 0);
  assert.ok(Math.abs(droneLane(0, 1, CONFIG.dronePeriod / 2) - 1) < 1e-9);
  const drone = obstacle(KIND.DRONE, 1, 20, { a: 1, b: 2, t: 0 });
  const start = lab({ obstacles: [drone] });
  const moving = runTo(start, 10).state.obstacles[0];
  assert.ok(moving.lane > 1 && moving.lane <= 2 && moving.t > 0);
  assert.equal(runTo(press(start, ACTION.LEFT), 30).state.phase, PHASE.RUN);

  const parked = lab({ obstacles: [obstacle(KIND.DRONE, 1, 20, { a: 1, b: 1, t: 0 })] });
  assert.equal(runTo(parked, 30).state.phase, PHASE.OVER);
  assert.equal(runTo(parked, 30, jumpAt(20)).state.phase, PHASE.OVER);
  assert.equal(runTo(parked, 30, slideAt(20)).state.phase, PHASE.OVER);

  const near = { ...lab(), distance: 20 };
  assert.ok(hits(near, { ...drone, lane: 1.4 }));
  assert.ok(!hits(near, { ...drone, lane: 1.6 }));
});

test('colisao varrida: obstaculo fino nao e atravessado com passo grande', () => {
  const start = { ...lab({ obstacles: [obstacle(KIND.HIGH, 1, 20)] }), distance: 18 };
  assert.equal(step(start, 0.5).state.phase, PHASE.OVER);
  const reach = HALF_DEPTH.high + CONFIG.playerHalfDepth;
  assert.ok(hits({ ...start, distance: 20 + reach + 1 }, start.obstacles[0], 20 - reach - 1));
  assert.ok(!hits({ ...start, distance: 20 + reach + 1 }, start.obstacles[0]));
});

test('escudo absorve uma batida so e destroi o obstaculo', () => {
  const start = lab({
    obstacles: [obstacle(KIND.BLOCK, 1, 20), obstacle(KIND.BLOCK, 1, 60)],
    items: [{ id: 1, type: ITEM.SHIELD, lane: 1, z: 8, h: 0.7 }],
  });
  const first = runTo(start, 40);
  assert.equal(first.state.phase, PHASE.RUN);
  assert.equal(first.state.shield, false);
  assert.equal(first.state.obstacles.length, 1);
  assert.equal(first.events.filter((event) => event.type === EVENT.POWER).length, 1);
  assert.equal(first.events.filter((event) => event.type === EVENT.SHIELD_BREAK).length, 1);
  assert.equal(runTo(first.state, 80).state.phase, PHASE.OVER);
});

test('moedas: pega na faixa e na altura certas, e contam na pontuacao', () => {
  const start = lab({ items: [coin(1, 10), coin(1, 12), coin(0, 14), coin(1, 16, 2.4)] });
  const { state, events } = runTo(start, 20);
  assert.equal(state.coins, 2);
  assert.equal(state.items.length, 2);
  assert.equal(events.filter((event) => event.type === EVENT.COIN).length, 2);
  assert.equal(scoreOf(state), Math.floor(state.distance) + 2 * CONFIG.coinScore);
  assert.ok(touches({ ...start, distance: 16, y: 1.6 }, coin(1, 16, 2.4)), 'moeda alta so pulando');

  const crashed = runTo({ ...state, obstacles: [obstacle(KIND.BLOCK, 1, 40)] }, 60).state;
  assert.equal(crashed.phase, PHASE.OVER);
  assert.equal(crashed.best, scoreOf(crashed));
  assert.equal(runTo({ ...state, best: 99999, obstacles: [obstacle(KIND.BLOCK, 1, 40)] }, 60).state.best, 99999);
});

test('ima puxa moedas das outras faixas enquanto dura', () => {
  const items = [coin(0, 12), coin(2, 14), coin(0, 16, 1.9)];
  assert.equal(runTo(lab({ items }), 30).state.coins, 0);
  const withMagnet = runTo(lab({ items: [...items, { id: 2, type: ITEM.MAGNET, lane: 1, z: 5, h: 0.7 }] }), 30).state;
  assert.equal(withMagnet.coins, 3);
  assert.ok(withMagnet.magnetT > 0 && withMagnet.magnetT < CONFIG.magnetSeconds);
  const later = runTo({ ...withMagnet, items: [coin(0, 400)] }, 420).state;
  assert.equal(later.magnetT, 0);
  assert.equal(later.coins, 3, 'depois que o ima acaba nao puxa mais');
});

test('velocidade sobe aos poucos e tem teto', () => {
  assert.equal(speedAt(0), CONFIG.baseSpeed);
  assert.equal(speedAt(-50), CONFIG.baseSpeed);
  for (let d = 0; d < 6000; d += 100) assert.ok(speedAt(d + 100) >= speedAt(d));
  assert.ok(speedAt(500) > speedAt(0) && speedAt(500) < CONFIG.baseSpeed * 1.3);
  assert.equal(speedAt(1e7), CONFIG.maxSpeed);
  assert.equal(difficultyAt(1e7), 1);
  assert.ok(gapAt(1e7) >= CONFIG.maxSpeed * CONFIG.minGapSeconds);
  const state = runTo(lab(), 300).state;
  assert.ok(state.distance >= 300 && state.distance < 301);
});

test('step e act nao mutam o estado recebido e emitem eventos', () => {
  const deepFreeze = (value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.values(value).forEach(deepFreeze);
    }
    return value;
  };
  let state = startRun(createState(), 99);
  const seen = new Set();
  for (let i = 0; i < 4000 && state.phase === PHASE.RUN; i += 1) {
    deepFreeze(state);
    const snapshot = JSON.stringify(state);
    const acted = botTurn(state);
    const result = step(acted, i % 3 === 0 ? 0.05 : DT);
    assert.equal(JSON.stringify(state), snapshot);
    result.events.forEach((event) => seen.add(event.type));
    state = result.state;
  }
  assert.equal(state.phase, PHASE.RUN);
  [EVENT.COIN, EVENT.LAND, EVENT.MILESTONE].forEach((type) => assert.ok(seen.has(type), type));
});

test('mesma semente gera a mesma pista; passo grande equivale a passos pequenos', () => {
  const a = runTo(startRun(createState(), 5), 400, botTurn).state;
  const b = runTo(startRun(createState(), 5), 400, botTurn).state;
  const c = runTo(startRun(createState(), 6), 400, botTurn).state;
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.obstacles.map((o) => [o.kind, o.lane]), c.obstacles.map((o) => [o.kind, o.lane]));
  const big = step(lab(), 0.05).state;
  let small = lab();
  for (let i = 0; i < 3; i += 1) small = step(small, 0.05 / 3).state;
  assert.ok(Math.abs(big.distance - small.distance) < 1e-6);
  assert.equal(step(lab(), 0).state.distance, 0);
  assert.equal(step(lab(), Number.NaN).state.distance, 0);
});

test('2000 trechos gerados sempre deixam um caminho possivel', () => {
  const rng = createRng(20261113);
  let cursor = { z: CONFIG.firstRowMeters, serial: 0, lastPowerZ: 0 };
  let lastRowZ = -Infinity;
  const kinds = new Set();
  const powers = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const segment = generateSegment(rng, cursor);
    assert.ok(segment.nextZ > cursor.z, `trecho ${i} nao avanca`);
    const rows = new Map();
    segment.obstacles.forEach((o) => rows.set(o.z, [...(rows.get(o.z) ?? []), o]));
    [...rows.keys()].sort((x, y) => x - y).forEach((z) => {
      const row = rows.get(z);
      const blocked = [0, 1, 2].filter((lane) => row.some((o) =>
        (o.kind === KIND.DRONE ? lane >= o.a && lane <= o.b : o.lane === lane && o.kind === KIND.BLOCK)));
      assert.ok(blocked.length < LANES, `trecho ${i}: fileira sem saida em z=${z}`);
      assert.ok(z >= cursor.z && z < segment.nextZ);
      const seconds = (z - lastRowZ) / speedAt(z);
      assert.ok(seconds >= CONFIG.minGapSeconds, `trecho ${i}: so ${seconds.toFixed(2)}s para reagir`);
      row.forEach((o) => kinds.add(o.kind));
      lastRowZ = z;
    });
    segment.items.forEach((item) => {
      if (item.type !== ITEM.COIN) powers.add(item.type);
      const inside = segment.obstacles.some((o) => (o.kind === KIND.BLOCK ? o.lane === item.lane
        : o.kind === KIND.DRONE && item.lane >= o.a && item.lane <= o.b) && Math.abs(o.z - item.z) < 4);
      assert.ok(!inside, `trecho ${i}: item dentro de obstaculo`);
      assert.ok(item.lane >= 0 && item.lane < LANES && item.h > 0);
    });
    cursor = { z: segment.nextZ, serial: cursor.serial + 1, lastPowerZ: segment.lastPowerZ };
  }
  assert.deepEqual([...kinds].sort(), Object.values(KIND).sort());
  assert.deepEqual([...powers].sort(), [ITEM.MAGNET, ITEM.SHIELD]);
});

test('jogador automatico vai muito alem de onde uma corrida sem comandos acaba', () => {
  const GOAL = 8000;
  [1, 2, 3, 4, 5, 6].forEach((seed) => {
    const idle = runTo(startRun(createState(), seed), GOAL).state;
    assert.equal(idle.phase, PHASE.OVER, `semente ${seed}: sem comandos deveria bater`);
    assert.ok(idle.distance < 1200, `semente ${seed}: sem comandos foi longe demais (${idle.distance})`);
    const bot = runTo(startRun(createState(), seed), GOAL, botTurn).state;
    assert.ok(bot.distance >= GOAL, `semente ${seed}: bot caiu em ${bot.distance.toFixed(0)} m`);
    assert.ok(bot.coins > 50, `semente ${seed}: poucas moedas (${bot.coins})`);
    assert.ok(bot.obstacles.length < 60 && bot.items.length < 120, 'o que ficou para tras e descartado');
  });
});

test('reviver vale uma vez, limpa a pista por perto e protege por 2 segundos', () => {
  const start = lab({ obstacles: [obstacle(KIND.BLOCK, 1, 20), obstacle(KIND.BLOCK, 1, 30), obstacle(KIND.BLOCK, 1, 90)] });
  const over = runTo(start, 50).state;
  assert.equal(over.phase, PHASE.OVER);
  assert.equal(revive(start), start, 'so revive depois de bater');
  const back = revive(over);
  assert.equal(back.phase, PHASE.RUN);
  assert.equal(back.distance, over.distance);
  assert.equal(back.coins, over.coins);
  assert.equal(back.invulnT, CONFIG.reviveInvulnSeconds);
  assert.deepEqual(back.obstacles.map((o) => o.z), [90]);
  assert.equal(over.obstacles.length, 3, 'reviver nao muta o estado');

  // Protegido, atravessa um obstaculo colocado logo a frente.
  const shielded = runTo({ ...back, obstacles: [obstacle(KIND.BLOCK, 1, back.distance + 10)] }, back.distance + 15).state;
  assert.equal(shielded.phase, PHASE.RUN);
  assert.ok(shielded.invulnT < CONFIG.reviveInvulnSeconds);
  const again = runTo(back, 120).state;
  assert.equal(again.phase, PHASE.OVER);
  assert.equal(again.invulnT, 0);
  assert.equal(revive(again), again, 'segunda vez nao revive');
  assert.equal(startRun(again, 3).revived, false);
  assert.equal(startRun({ ...again, best: 77 }, 3).best, 77);
});

test('save faz ida e volta e tolera dado invalido', () => {
  assert.deepEqual(parseSave(serializeSave(1234)), { best: 1234 });
  for (const raw of ['', null, undefined, 42, {}, 'lixo', '[]', 'null', '{"best":-2}', '{"best":"x"}', '{"best":null}', '{"best":1e999}']) {
    assert.deepEqual(parseSave(raw), { best: 0 });
  }
  assert.deepEqual(parseSave('{"best":7.8}'), { best: 7 });
  assert.deepEqual(parseSave('{"best":"15"}'), { best: 15 });
  assert.ok(parseSave('{"best":1e300}').best <= 100000000);
});

test('textos: pt e en com as mesmas chaves, e ingles como reserva', () => {
  const pt = stringsFor('pt-BR');
  const en = stringsFor('en-US');
  assert.equal(pt.playAgain, 'Jogar de novo');
  assert.equal(en.playAgain, 'Play again');
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
  Object.values({ ...pt, ...en }).forEach((text) => assert.ok(typeof text === 'string' && text.length > 0));
  for (const tag of ['fr-FR', 'xx', '', null, undefined, 42]) assert.equal(stringsFor(tag), en);
  assert.equal(stringsFor('PT'), pt);
});
