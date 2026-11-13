import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, PHASE, SLOTS } from '../guardioes/src/config.js';
import { PATH_LENGTH, pathPoint } from '../guardioes/src/path.js';
import {
  EVENT, buyCost, buyHero, canBuy, canMerge, createState, heroDamage, moveHero, revive, startRun, step, waveSpec,
} from '../guardioes/src/sim.js';
import { parseSave, serializeSave } from '../guardioes/src/save.js';

const DT = 1 / 30;

// Jogador automatico simples: compra sempre que pode e junta qualquer par igual.
const botTurn = (state) => {
  let current = state;
  while (canBuy(current)) current = buyHero(current).state;
  for (let merged = true; merged;) {
    merged = false;
    for (let from = 0; from < SLOTS.length && !merged; from += 1) {
      for (let to = 0; to < SLOTS.length && !merged; to += 1) {
        if (canMerge(current, from, to)) {
          current = moveHero(current, Math.max(from, to), Math.min(from, to)).state;
          merged = true;
        }
      }
    }
  }
  return current;
};

const playRun = (useBot, maxSeconds) => {
  let state = startRun(createState());
  for (let t = 0; t < maxSeconds && state.phase !== PHASE.OVER; t += DT) {
    if (useBot) state = botTurn(state);
    state = step(state, DT).state;
  }
  return state;
};

test('caminho comeca na caverna, termina no castelo e tem comprimento positivo', () => {
  assert.deepEqual(pathPoint(0), { x: 300, y: 58 });
  assert.deepEqual(pathPoint(PATH_LENGTH + 50), { x: 180, y: 452 });
  assert.ok(PATH_LENGTH > 800);
  const mid = pathPoint(66 + 115);
  assert.ok(Math.abs(mid.x - 185) < 1e-9 && mid.y === 124);
});

test('todo pedestal alcanca o caminho e nao fica em cima dele', () => {
  SLOTS.forEach((slot, index) => {
    let nearest = Infinity;
    for (let d = 0; d <= PATH_LENGTH; d += 4) {
      const point = pathPoint(d);
      nearest = Math.min(nearest, Math.hypot(point.x - slot.x, point.y - slot.y));
    }
    assert.ok(nearest > 38, `pedestal ${index} em cima do caminho (${nearest.toFixed(1)})`);
    assert.ok(nearest < CONFIG.heroRange, `pedestal ${index} longe demais (${nearest.toFixed(1)})`);
  });
});

test('comprar gasta moedas, ocupa o primeiro pedestal livre e encarece', () => {
  const state = startRun(createState());
  const { state: after, slot } = buyHero(state);
  assert.equal(slot, 0);
  assert.equal(after.coins, state.coins - buyCost(0));
  assert.deepEqual(after.heroes[0], { tier: 1, cd: 0 });
  assert.ok(buyCost(1) > buyCost(0));
  assert.equal(state.heroes[0], null);
  const broke = { ...state, coins: 0 };
  assert.equal(buyHero(broke).state, broke);
  assert.equal(buyHero(createState()).slot, -1);
});

test('arrastar junta iguais, troca diferentes e move para vazio', () => {
  const base = startRun(createState());
  const withHeroes = (tiers) => ({ ...base, heroes: base.heroes.map((_, i) => (tiers[i] ? { tier: tiers[i], cd: 0.3 } : null)) });

  const merged = moveHero(withHeroes([2, 2]), 0, 1);
  assert.ok(merged.merged);
  assert.equal(merged.state.heroes[0], null);
  assert.deepEqual(merged.state.heroes[1], { tier: 3, cd: 0 });

  const swapped = moveHero(withHeroes([1, 3]), 0, 1);
  assert.ok(!swapped.merged);
  assert.equal(swapped.state.heroes[0].tier, 3);
  assert.equal(swapped.state.heroes[1].tier, 1);

  const moved = moveHero(withHeroes([4]), 0, 5).state;
  assert.equal(moved.heroes[0], null);
  assert.equal(moved.heroes[5].tier, 4);

  const top = withHeroes([CONFIG.maxTier, CONFIG.maxTier]);
  assert.ok(!moveHero(top, 0, 1).merged);
  assert.equal(moveHero(top, 0, 0).state, top);
  assert.equal(moveHero(top, 0, 99).state, top);
});

test('juntar compensa: um guardiao do nivel seguinte bate mais que dois do anterior', () => {
  for (let tier = 1; tier < CONFIG.maxTier; tier += 1) {
    assert.ok(heroDamage(tier + 1) > heroDamage(tier) * 2);
  }
});

test('ondas ficam mais dificeis', () => {
  assert.ok(waveSpec(10).hp > waveSpec(1).hp * 4);
  assert.ok(waveSpec(10).count > waveSpec(1).count);
  assert.ok(waveSpec(500).count <= CONFIG.enemyCountCap);
});

test('sem guardioes o castelo cai e a partida acaba', () => {
  const state = playRun(false, 120);
  assert.equal(state.phase, PHASE.OVER);
  assert.equal(state.baseHp, 0);
  assert.equal(step(state, DT).state, state);
});

test('reviver vale uma vez e devolve o castelo inteiro', () => {
  const over = playRun(false, 120);
  const back = revive(over);
  assert.equal(back.phase, PHASE.BUILD);
  assert.equal(back.baseHp, CONFIG.baseHp);
  assert.equal(back.wave, over.wave);
  assert.equal(back.enemies.length, 0);
  assert.equal(revive({ ...back, phase: PHASE.OVER }).revived, true);
  assert.equal(revive({ ...back, phase: PHASE.OVER }).phase, PHASE.OVER);
});

test('step nao muta o estado recebido e emite eventos', () => {
  let state = buyHero(startRun(createState())).state;
  const seen = new Set();
  for (let i = 0; i < 900; i += 1) {
    const snapshot = JSON.stringify(state);
    const result = step(state, DT);
    assert.equal(JSON.stringify(state), snapshot);
    result.events.forEach((event) => seen.add(event.type));
    state = result.state;
  }
  [EVENT.WAVE_START, EVENT.SHOT, EVENT.HIT, EVENT.KILL].forEach((type) => assert.ok(seen.has(type), type));
});

test('balanceamento: jogador automatico passa da onda 8 e perde antes da 60', () => {
  const state = playRun(true, 3600);
  assert.equal(state.phase, PHASE.OVER, `nao perdeu em 1h de jogo (onda ${state.wave})`);
  assert.ok(state.wave > 8, `caiu cedo demais, na onda ${state.wave}`);
  assert.ok(state.wave < 60, `foi longe demais, onda ${state.wave}`);
  console.log(`  bot caiu na onda ${state.wave}`);
});

test('save faz ida e volta e tolera dado invalido', () => {
  assert.deepEqual(parseSave(serializeSave(17)), { best: 17 });
  for (const raw of ['', null, undefined, 'lixo', '[]', 'null', '{"best":-2}', '{"best":"x"}']) {
    assert.deepEqual(parseSave(raw), { best: 0 });
  }
  assert.deepEqual(parseSave('{"best":7.8}'), { best: 7 });
});
