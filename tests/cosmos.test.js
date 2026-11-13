import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPSULE, CONFIG, PHASE, TIERS } from '../cosmos/src/config.js';
import { nextRandom, pickWeighted } from '../cosmos/src/rng.js';
import { makeBody, stepBodies, tierRadius } from '../cosmos/src/physics.js';
import {
  EVENT, LAST_TIER, canDrop, clampAim, createState, drop, inDanger, revive, startRun, step,
} from '../cosmos/src/sim.js';
import { parseSave, serializeSave } from '../cosmos/src/save.js';
import { stringsFor } from '../cosmos/src/strings.js';

const DT = CONFIG.fixedDt;
const FRAME = 1 / 60;
const MID = (CAPSULE.left + CAPSULE.right) / 2;

const makeRng = (start) => {
  let seed = start;
  return () => {
    const roll = nextRandom(seed);
    seed = roll.seed;
    return roll.value;
  };
};

const playing = (bodies, extra = {}) => ({ ...startRun(createState()), bodies, nextId: 100, ...extra });
const settled = (id, tier, x, y) => makeBody(id, tier, x, y, { age: 5 });
const run = (state, seconds) => {
  let current = state;
  const events = [];
  for (let t = 0; t < seconds; t += FRAME) {
    const result = step(current, FRAME);
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
};

const assertInside = (bodies, label) => {
  bodies.forEach((body) => {
    ['x', 'y', 'vx', 'vy', 'r', 'rot', 'w'].forEach((key) => assert.ok(Number.isFinite(body[key]), `${label}: ${key} invalido`));
    assert.ok(body.x - body.r >= CAPSULE.left - 1e-6, `${label}: atravessou a parede esquerda`);
    assert.ok(body.x + body.r <= CAPSULE.right + 1e-6, `${label}: atravessou a parede direita`);
    assert.ok(body.y + body.r <= CAPSULE.floor + 1e-6, `${label}: atravessou o chao`);
  });
};

test('gerador com semente e deterministico e fica entre 0 e 1', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 500; i += 1) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
  assert.equal(pickWeighted([1, 1, 1], 0), 0);
  assert.equal(pickWeighted([1, 1, 1], 0.999999), 2);
  assert.equal(pickWeighted([0, 5, 0], 0.5), 1);
});

test('niveis crescem em tamanho e em pontos', () => {
  assert.equal(TIERS.length, 10);
  for (let tier = 1; tier < TIERS.length; tier += 1) {
    assert.ok(TIERS[tier].radius > TIERS[tier - 1].radius);
    assert.ok(TIERS[tier].points > TIERS[tier - 1].points);
  }
  assert.ok(CONFIG.galaxyBonus > TIERS[LAST_TIER].points);
  assert.ok(tierRadius(LAST_TIER) * 2 < CAPSULE.right - CAPSULE.left);
  // Nenhum corpo anda mais que o menor raio num passo: nao da para atravessar parede.
  assert.ok(CONFIG.maxSpeed * DT < tierRadius(0));
});

test('fisica estavel: 60 corpos soltos, 60 s, ninguem sai da capsula e tudo assenta', () => {
  const random = makeRng(20261113);
  let bodies = [];
  let worstSpeed = 0;
  const steps = Math.round(60 / DT);
  for (let i = 0; i < steps; i += 1) {
    // Um corpo novo a cada 0,2 s, de niveis e posicoes sorteados.
    if (i % 24 === 0 && bodies.length < 60) {
      const tier = Math.floor(random() * 5);
      const x = clampAim(CAPSULE.left + random() * (CAPSULE.right - CAPSULE.left), tier);
      bodies = [...bodies, makeBody(bodies.length + 1, tier, x, CAPSULE.dropY - 400)];
    }
    bodies = stepBodies(bodies, DT).bodies;
    assertInside(bodies, `passo ${i}`);
    bodies.forEach((body) => { worstSpeed = Math.max(worstSpeed, Math.hypot(body.vx, body.vy)); });
  }
  assert.equal(bodies.length, 60);
  assert.ok(worstSpeed <= CONFIG.maxSpeed + 1e-6, `velocidade explodiu: ${worstSpeed}`);
  const fastest = Math.max(...bodies.map((body) => Math.hypot(body.vx, body.vy)));
  assert.ok(fastest < 8, `nao assentou: ${fastest.toFixed(2)} px/s`);
  let deepest = 0;
  bodies.forEach((a, i) => bodies.slice(i + 1).forEach((b) => {
    deepest = Math.max(deepest, a.r + b.r - Math.hypot(b.x - a.x, b.y - a.y));
  }));
  assert.ok(deepest < 3, `corpos afundados um no outro: ${deepest.toFixed(2)} px`);
  // Depois de assentar, ninguem fica tremendo: a posicao quase nao muda em mais 2 s.
  const before = bodies.map((body) => ({ x: body.x, y: body.y }));
  for (let i = 0; i < 240; i += 1) bodies = stepBodies(bodies, DT).bodies;
  const drift = Math.max(...bodies.map((body, i) => Math.hypot(body.x - before[i].x, body.y - before[i].y)));
  assert.ok(drift < 3, `corpos ainda se mexendo: ${drift.toFixed(2)} px`);
});

test('fisica nao muta os corpos recebidos', () => {
  const bodies = [makeBody(1, 2, 100, 300), makeBody(2, 3, 110, 330), makeBody(3, 0, 60, CAPSULE.floor - 5)];
  const snapshot = JSON.stringify(bodies);
  const result = stepBodies(bodies, DT);
  assert.equal(JSON.stringify(bodies), snapshot);
  assert.notEqual(result.bodies[0], bodies[0]);
});

test('corpo muito rapido nao atravessa parede nem chao', () => {
  let bodies = [
    makeBody(1, 0, MID, 300, { vx: -90000, vy: 0 }),
    makeBody(2, 0, MID, 320, { vx: 90000, vy: 90000 }),
  ];
  for (let i = 0; i < 240; i += 1) {
    bodies = stepBodies(bodies, DT).bodies;
    assertInside(bodies, `passo ${i}`);
  }
});

test('dois iguais encostados viram um do proximo nivel e pontuam', () => {
  const y = CAPSULE.floor - tierRadius(2);
  const state = playing([settled(1, 2, 150, y), settled(2, 2, 150 + tierRadius(2) * 2, y)]);
  const snapshot = JSON.stringify(state);
  const result = step(state, FRAME);
  assert.equal(JSON.stringify(state), snapshot, 'step alterou o estado recebido');
  assert.equal(result.state.bodies.length, 1);
  const [born] = result.state.bodies;
  assert.equal(born.tier, 3);
  assert.equal(born.id, 100);
  assert.ok(Math.abs(born.x - (150 + tierRadius(2))) < 1);
  assert.equal(result.state.score, TIERS[3].points);
  const merges = result.events.filter((event) => event.type === EVENT.MERGE);
  assert.equal(merges.length, 1);
  assert.deepEqual({ tier: merges[0].tier, final: merges[0].final, score: merges[0].score }, { tier: 3, final: false, score: TIERS[3].points });
  // O corpo novo cresce ate o raio cheio e fica dentro da capsula.
  const later = run(result.state, 1).state;
  assert.equal(later.bodies[0].r, tierRadius(3));
  assertInside(later.bodies, 'depois da fusao');
});

test('niveis diferentes encostados nao se juntam', () => {
  const state = playing([
    settled(1, 1, 120, CAPSULE.floor - tierRadius(1)),
    settled(2, 2, 120 + tierRadius(1) + tierRadius(2), CAPSULE.floor - tierRadius(2)),
  ]);
  const { state: after, events } = run(state, 3);
  assert.equal(after.bodies.length, 2);
  assert.equal(after.score, 0);
  assert.ok(!events.some((event) => event.type === EVENT.MERGE));
  assert.deepEqual(after.bodies.map((body) => body.tier).sort(), [1, 2]);
});

test('iguais longe um do outro nao se juntam; cada corpo funde so uma vez por passo', () => {
  const y = CAPSULE.floor - tierRadius(0);
  const apart = run(playing([settled(1, 0, 60, y), settled(2, 0, 300, y)]), 2).state;
  assert.equal(apart.bodies.length, 2);
  const trio = playing([settled(1, 0, 100, y), settled(2, 0, 124, y), settled(3, 0, 148, y)]);
  const result = step(trio, FRAME).state;
  assert.deepEqual(result.bodies.map((body) => body.tier).sort(), [0, 1]);
});

test('dois do ultimo nivel somem e dao o bonus', () => {
  const r = tierRadius(LAST_TIER);
  const state = playing([settled(1, LAST_TIER, CAPSULE.left + r, CAPSULE.floor - r), settled(2, LAST_TIER, CAPSULE.right - r, CAPSULE.floor - r - 40)]);
  const { state: after, events } = run(state, 3);
  assert.equal(after.bodies.length, 0);
  assert.equal(after.score, CONFIG.galaxyBonus);
  assert.ok(events.some((event) => event.type === EVENT.MERGE && event.final));
});

test('soltar: respeita a espera, prende a mira na capsula e sorteia o proximo', () => {
  const title = createState();
  assert.equal(drop(title, MID), title);
  const state = startRun(createState(7), 99);
  assert.equal(state.best, 7);
  assert.ok(canDrop(state));
  const after = drop(state, -500);
  assert.equal(state.bodies.length, 0, 'drop alterou o estado recebido');
  assert.equal(after.bodies.length, 1);
  assert.equal(after.bodies[0].tier, state.current);
  assert.equal(after.bodies[0].x, CAPSULE.left + tierRadius(state.current));
  assert.equal(after.current, state.next);
  assert.ok(after.next >= 0 && after.next < CONFIG.dropWeights.length);
  assert.equal(drop(after, MID), after, 'soltou durante a espera');
  const ready = run(after, CONFIG.dropCooldown + 0.1).state;
  assert.ok(canDrop(ready));
  assert.equal(clampAim(NaN, 0), MID);
  assert.equal(clampAim(9999, 4), CAPSULE.right - tierRadius(4));
  // Mesma semente, mesma sequencia de corpos.
  assert.deepEqual(startRun(createState(), 5), startRun(createState(), 5));
});

// Coluna perfeitamente alinhada de niveis diferentes: fica de pe e passa da linha.
const tower = () => {
  let y = CAPSULE.floor;
  return [9, 8, 7, 6].map((tier, index) => {
    y -= tierRadius(tier);
    const body = settled(index + 1, tier, MID, y);
    y -= tierRadius(tier);
    return body;
  });
};

test('fim de jogo: corpo assentado acima da linha por 1,5 s', () => {
  const state = playing(tower());
  assert.ok(state.bodies.some(inDanger));
  const early = run(state, CONFIG.dangerSeconds - 0.3);
  assert.equal(early.state.phase, PHASE.PLAY);
  assert.ok(early.state.dangerT > 0);
  const late = run(early.state, 0.6);
  assert.equal(late.state.phase, PHASE.OVER);
  assert.equal(late.events.filter((event) => event.type === EVENT.OVER).length, 1);
  assert.equal(step(late.state, FRAME).state, late.state);
  assert.equal(drop(late.state, MID), late.state);
});

test('corpo recem-solto passando pela linha nao acaba o jogo; recorde atualiza no fim', () => {
  let state = startRun(createState(3), 11);
  for (let i = 0; i < 5; i += 1) {
    state = drop(state, 60 + i * 55);
    state = run(state, 2.5).state;
    assert.equal(state.phase, PHASE.PLAY);
    assert.equal(state.dangerT, 0);
  }
  const over = run(playing(tower(), { score: 40, best: 3 }), 3).state;
  assert.equal(over.phase, PHASE.OVER);
  assert.equal(over.best, 40);
  const kept = run(playing(tower(), { score: 2, best: 90 }), 3).state;
  assert.equal(kept.best, 90);
});

test('continuar: tira o terco de cima, vale uma vez e o jogo segue', () => {
  const over = run(playing([...tower(), settled(5, 0, 60, CAPSULE.floor - 12), settled(6, 1, 290, CAPSULE.floor - 17)], { score: 25 }), 3).state;
  assert.equal(over.phase, PHASE.OVER);
  const snapshot = JSON.stringify(over);
  const back = revive(over);
  assert.equal(JSON.stringify(over), snapshot, 'revive alterou o estado recebido');
  assert.equal(back.phase, PHASE.PLAY);
  assert.equal(back.revived, true);
  assert.equal(back.score, 25);
  assert.equal(back.dangerT, 0);
  assert.ok(back.bodies.length <= over.bodies.length - Math.ceil(over.bodies.length / 3));
  assert.ok(back.bodies.length > 0);
  assert.ok(!back.bodies.some(inDanger));
  assert.ok(back.bodies.every((body) => body.y - body.r >= CAPSULE.dangerY));
  const going = run(back, 4).state;
  assert.equal(going.phase, PHASE.PLAY);
  const again = { ...going, phase: PHASE.OVER };
  assert.equal(revive(again), again, 'continuou duas vezes');
  assert.equal(revive(going), going, 'continuou sem ter acabado');
  assert.equal(startRun(again).revived, false);
});

test('partida inteira com jogador aleatorio: pontua, acaba e nunca sai da capsula', () => {
  const random = makeRng(7);
  let state = startRun(createState(), 123);
  const seen = new Set();
  for (let t = 0; t < 1800 && state.phase === PHASE.PLAY; t += FRAME) {
    if (canDrop(state)) state = drop(state, CAPSULE.left + random() * (CAPSULE.right - CAPSULE.left));
    const result = step(state, FRAME);
    result.events.forEach((event) => seen.add(event.type));
    state = result.state;
    assertInside(state.bodies, `t=${t.toFixed(2)}`);
  }
  assert.equal(state.phase, PHASE.OVER, 'nao acabou em 30 min soltando sem parar');
  assert.ok(state.score > 0);
  assert.equal(state.best, state.score);
  [EVENT.MERGE, EVENT.BUMP, EVENT.OVER].forEach((type) => assert.ok(seen.has(type), type));
  console.log(`  jogador aleatorio: ${state.score} pontos, ${state.bodies.length} corpos no fim`);
});

test('step limita o tempo de um quadro e ignora dt negativo', () => {
  const state = drop(startRun(createState(), 3), MID);
  const huge = step(state, 50).state;
  assert.ok(huge.bodies[0].age <= CONFIG.fixedDt * CONFIG.maxSubsteps + 1e-9);
  assert.equal(step(state, -1).state.bodies[0].y, state.bodies[0].y);
});

test('save faz ida e volta e tolera dado invalido', () => {
  assert.deepEqual(parseSave(serializeSave(1234)), { best: 1234 });
  for (const raw of ['', null, undefined, 42, {}, 'lixo', '[]', 'null', '{"best":-2}', '{"best":"x"}', '{"best":null}', '{"best":1e999}', '{"best"']) {
    assert.deepEqual(parseSave(raw), { best: 0 });
  }
  assert.deepEqual(parseSave('{"best":7.8}'), { best: 7 });
  assert.deepEqual(parseSave('{"best":"15"}'), { best: 15 });
  assert.ok(parseSave('{"best":1e300}').best <= 100000000);
});

test('textos: pt e en completos, com ingles como padrao', () => {
  assert.equal(stringsFor('pt-BR').tapToStart, 'Toque para jogar');
  assert.equal(stringsFor('PT').title, stringsFor('pt').title);
  assert.equal(stringsFor('en-US').tapToStart, 'Tap to play');
  for (const tag of ['ja', '', null, undefined, 42, 'x']) assert.equal(stringsFor(tag), stringsFor('en'));
  const pt = stringsFor('pt');
  const en = stringsFor('en');
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
  [...Object.values(pt), ...Object.values(en)].forEach((text) => assert.ok(typeof text === 'string' && text.length > 0));
});
