// Regras do jogo. Funcoes puras: recebem um estado e devolvem um novo, mais a lista do que aconteceu.
import { CAPSULE, CONFIG, PHASE, TIERS } from './config.js';
import { nextRandom, pickWeighted } from './rng.js';
import { makeBody, stepBodies, tierRadius } from './physics.js';

export const EVENT = Object.freeze({ MERGE: 'merge', BUMP: 'bump', OVER: 'over' });

export const LAST_TIER = TIERS.length - 1;

export const createState = (best = 0, seed = 1) => ({
  phase: PHASE.TITLE,
  bodies: [],
  score: 0,
  best,
  current: 0,
  next: 0,
  dropCd: 0,
  dangerT: 0,
  revived: false,
  seed: seed >>> 0,
  nextId: 1,
  acc: 0,
});

const rollTier = (seed) => {
  const roll = nextRandom(seed);
  return { seed: roll.seed, tier: pickWeighted(CONFIG.dropWeights, roll.value) };
};

export const startRun = (state, seed = state.seed) => {
  const first = rollTier(seed >>> 0);
  const second = rollTier(first.seed);
  return { ...createState(state.best, second.seed), phase: PHASE.PLAY, current: first.tier, next: second.tier };
};

// Mantem a mira dentro da capsula para o corpo que esta na mao.
export const clampAim = (x, tier) => {
  const radius = tierRadius(tier);
  const value = Number.isFinite(x) ? x : (CAPSULE.left + CAPSULE.right) / 2;
  return Math.min(CAPSULE.right - radius, Math.max(CAPSULE.left + radius, value));
};

export const canDrop = (state) => state.phase === PHASE.PLAY && state.dropCd <= 0;

// Solta o corpo da mao na posicao `x`. Se nao puder, devolve o mesmo estado.
export const drop = (state, x) => {
  if (!canDrop(state)) return state;
  const body = makeBody(state.nextId, state.current, clampAim(x, state.current), CAPSULE.dropY);
  const roll = rollTier(state.seed);
  return {
    ...state,
    bodies: [...state.bodies, body],
    current: state.next,
    next: roll.tier,
    seed: roll.seed,
    nextId: state.nextId + 1,
    dropCd: CONFIG.dropCooldown,
  };
};

const touching = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) <= a.r + b.r + CONFIG.mergeSlop;

const fuse = (a, b, id) => {
  const keep = CONFIG.mergeKeepSpeed / 2;
  const from = Math.max(a.r, b.r);
  // Um dos dois pode ainda estar crescendo: garante que o novo nasce dentro da capsula.
  const x = Math.min(CAPSULE.right - from, Math.max(CAPSULE.left + from, (a.x + b.x) / 2));
  const y = Math.min(CAPSULE.floor - from, (a.y + b.y) / 2);
  return makeBody(id, a.tier + 1, x, y, {
    vx: (a.vx + b.vx) * keep, vy: (a.vy + b.vy) * keep, rot: a.rot, w: (a.w + b.w) / 2, r0: from, r: from,
  });
};

// Dois corpos iguais encostados viram um do proximo nivel. Dois do ultimo nivel somem com um bonus.
const mergePass = (bodies, firstId, events) => {
  const used = new Set();
  const born = [];
  let gained = 0;
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length && !used.has(bodies[i].id); j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      if (a.tier !== b.tier || used.has(b.id) || !touching(a, b)) continue;
      used.add(a.id).add(b.id);
      const final = a.tier === LAST_TIER;
      const score = final ? CONFIG.galaxyBonus : TIERS[a.tier + 1].points;
      if (!final) born.push(fuse(a, b, firstId + born.length));
      gained += score;
      events.push({ type: EVENT.MERGE, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, tier: final ? a.tier : a.tier + 1, final, score });
    }
  }
  if (used.size === 0) return { bodies, nextId: firstId, gained };
  return { bodies: [...bodies.filter((body) => !used.has(body.id)), ...born], nextId: firstId + born.length, gained };
};

// Corpo ja assentado (nao acabou de ser solto ou criado) com o topo acima da linha.
export const inDanger = (body) =>
  body.age > CONFIG.dangerGraceSeconds && body.y - body.r < CAPSULE.dangerY;

const substep = (state, events) => {
  const dt = CONFIG.fixedDt;
  const physics = stepBodies(state.bodies, dt);
  physics.bumps.forEach((bump) => events.push({ type: EVENT.BUMP, ...bump }));
  const merged = mergePass(physics.bodies, state.nextId, events);
  const dangerT = merged.bodies.some(inDanger)
    ? state.dangerT + dt
    : Math.max(0, state.dangerT - dt * CONFIG.dangerCoolRate);
  const next = {
    ...state,
    bodies: merged.bodies,
    nextId: merged.nextId,
    score: state.score + merged.gained,
    dropCd: Math.max(0, state.dropCd - dt),
    dangerT,
  };
  if (dangerT < CONFIG.dangerSeconds) return next;
  events.push({ type: EVENT.OVER, score: next.score, record: next.score > next.best });
  return { ...next, phase: PHASE.OVER, best: Math.max(next.best, next.score) };
};

// Continuar depois do fim: tira o terco de cima dos corpos. Vale uma vez por partida.
export const revive = (state) => {
  if (state.phase !== PHASE.OVER || state.revived) return state;
  const byHeight = [...state.bodies].sort((a, b) => (a.y - a.r) - (b.y - b.r));
  const cut = Math.ceil(byHeight.length * CONFIG.reviveFraction);
  const removed = new Set(byHeight.slice(0, cut).map((body) => body.id));
  const safeY = CAPSULE.dangerY + CONFIG.reviveClearance;
  return {
    ...state,
    phase: PHASE.PLAY,
    bodies: state.bodies.filter((body) => !removed.has(body.id) && body.y - body.r >= safeY),
    dangerT: 0,
    dropCd: CONFIG.dropCooldown,
    acc: 0,
    revived: true,
  };
};

/**
 * @param {object} state estado atual
 * @param {number} dt segundos desde o ultimo quadro
 * @returns {{state: object, events: object[]}}
 */
export const step = (state, dt) => {
  if (state.phase !== PHASE.PLAY) return { state, events: [] };
  const events = [];
  let current = state;
  let acc = Math.min(state.acc + Math.max(0, dt), CONFIG.fixedDt * CONFIG.maxSubsteps);
  // Passo fixo: a fisica roda sempre no mesmo ritmo, seja qual for a taxa de quadros.
  while (acc >= CONFIG.fixedDt && current.phase === PHASE.PLAY) {
    current = substep(current, events);
    acc -= CONFIG.fixedDt;
  }
  return { state: { ...current, acc }, events };
};
