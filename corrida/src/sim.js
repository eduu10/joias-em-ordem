// Simulacao do jogo. Funcoes puras: recebem um estado e devolvem um novo, mais a lista do que aconteceu.
import { ACTION, CONFIG, HALF_DEPTH, ITEM, KIND, LANES, PHASE, START_LANE } from './config.js';
import { createRng } from './rng.js';
import { droneLane, generateSegment } from './patterns.js';
import { speedAt } from './speed.js';

export { speedAt };

export const EVENT = Object.freeze({
  LANE: 'lane', BUMP: 'bump', JUMP: 'jump', LAND: 'land', SLIDE: 'slide', COIN: 'coin', POWER: 'power',
  SHIELD_BREAK: 'shieldBreak', CRASH: 'crash', OVER: 'over', MILESTONE: 'milestone',
});

// Gravidade e impulso que dao exatamente a altura e a duracao de pulo configuradas.
export const GRAVITY = (8 * CONFIG.jumpHeight) / CONFIG.jumpSeconds ** 2;
export const JUMP_VELOCITY = (4 * CONFIG.jumpHeight) / CONFIG.jumpSeconds;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const scoreOf = (state) => Math.floor(state.distance) + state.coins * CONFIG.coinScore;
export const isSliding = (state) => state.slideT > 0;
export const playerCenter = (state) => state.y + (isSliding(state) ? CONFIG.slideCenter : CONFIG.standCenter);

export const createState = (best = 0, seed = 1) => ({
  phase: PHASE.TITLE,
  distance: 0,
  coins: 0,
  best,
  revived: false,
  lane: START_LANE,
  x: START_LANE,
  y: 0,
  vy: 0,
  airborne: false,
  slideT: 0,
  buffer: null,
  magnetT: 0,
  shield: false,
  invulnT: 0,
  obstacles: [],
  items: [],
  nextZ: CONFIG.firstRowMeters,
  serial: 0,
  lastPowerZ: 0,
  nextId: 1,
  seed: seed >>> 0,
});

export const startRun = (state, seed = 1) => ({ ...createState(state.best, seed), phase: PHASE.RUN });

// Volta a correr do mesmo ponto, sem obstaculos por perto e com alguns segundos de protecao. Vale uma vez.
export const revive = (state) => {
  if (state.phase !== PHASE.OVER || state.revived) return state;
  const from = state.distance - CONFIG.despawnBehind;
  const to = state.distance + CONFIG.reviveClearMeters;
  return {
    ...state,
    phase: PHASE.RUN,
    revived: true,
    invulnT: CONFIG.reviveInvulnSeconds,
    x: state.lane,
    y: 0,
    vy: 0,
    airborne: false,
    slideT: 0,
    buffer: null,
    obstacles: state.obstacles.filter((obstacle) => obstacle.z < from || obstacle.z > to),
  };
};

const applyAction = (state, action, events) => {
  if (action === ACTION.LEFT || action === ACTION.RIGHT) {
    const side = action === ACTION.LEFT ? -1 : 1;
    const lane = clamp(state.lane + side, 0, LANES - 1);
    events.push({ type: lane === state.lane ? EVENT.BUMP : EVENT.LANE, side });
    return lane === state.lane ? state : { ...state, lane };
  }
  if (action === ACTION.JUMP) {
    // No ar o pulo fica guardado um instante e sai assim que o robo tocar o chao.
    if (state.airborne) return { ...state, buffer: { action, t: CONFIG.bufferSeconds } };
    events.push({ type: EVENT.JUMP });
    return { ...state, airborne: true, vy: JUMP_VELOCITY, slideT: 0, buffer: null };
  }
  if (action === ACTION.SLIDE) {
    // No ar, deslizar derruba o robo rapido e ele ja chega deslizando.
    if (state.airborne) {
      return { ...state, vy: Math.min(state.vy, -CONFIG.fastFallSpeed), buffer: { action, t: CONFIG.bufferSeconds } };
    }
    events.push({ type: EVENT.SLIDE });
    return { ...state, slideT: CONFIG.slideSeconds, buffer: null };
  }
  return state;
};

/**
 * Aplica um comando do jogador.
 * @param {object} state estado atual
 * @param {string} action um dos valores de ACTION
 * @returns {{state: object, events: object[]}}
 */
export const act = (state, action) => {
  if (state.phase !== PHASE.RUN) return { state, events: [] };
  const events = [];
  return { state: applyAction(state, action, events), events };
};

const stepVertical = (state, dt, events) => {
  if (!state.airborne) return state;
  const vy = state.vy - GRAVITY * dt;
  const y = state.y + vy * dt;
  if (y > 0) return { ...state, y, vy };
  events.push({ type: EVENT.LAND });
  const landed = { ...state, y: 0, vy: 0, airborne: false, buffer: null };
  return state.buffer ? applyAction(landed, state.buffer.action, events) : landed;
};

const stepMotion = (state, dt, events) => {
  const distance = state.distance + speedAt(state.distance) * dt;
  const reach = CONFIG.laneRate * dt;
  const buffer = state.buffer && state.buffer.t > dt ? { ...state.buffer, t: state.buffer.t - dt } : null;
  const mark = Math.floor(distance / CONFIG.milestoneMeters);
  if (mark > Math.floor(state.distance / CONFIG.milestoneMeters)) {
    events.push({ type: EVENT.MILESTONE, meters: mark * CONFIG.milestoneMeters });
  }
  return stepVertical({
    ...state,
    distance,
    x: state.x + clamp(state.lane - state.x, -reach, reach),
    slideT: Math.max(0, state.slideT - dt),
    magnetT: Math.max(0, state.magnetT - dt),
    invulnT: Math.max(0, state.invulnT - dt),
    buffer,
  }, dt, events);
};

// Cria a pista a frente e esquece o que ja ficou para tras.
const stepSpawns = (state) => {
  const horizon = state.distance + CONFIG.spawnAhead;
  const behind = state.distance - CONFIG.despawnBehind;
  const stale = (thing) => thing.z < behind;
  if (state.nextZ > horizon && !state.obstacles.some(stale) && !state.items.some(stale)) return state;
  const rng = createRng(state.seed);
  let cursor = { z: state.nextZ, serial: state.serial, lastPowerZ: state.lastPowerZ };
  const fresh = { obstacles: [], items: [] };
  while (cursor.z <= horizon) {
    const segment = generateSegment(rng, cursor);
    fresh.obstacles.push(...segment.obstacles);
    fresh.items.push(...segment.items);
    cursor = { z: segment.nextZ, serial: cursor.serial + 1, lastPowerZ: segment.lastPowerZ };
  }
  const tag = (list, offset) => list.map((thing, index) => ({ ...thing, id: state.nextId + offset + index }));
  return {
    ...state,
    obstacles: [...state.obstacles.filter((o) => !stale(o)), ...tag(fresh.obstacles, 0)],
    items: [...state.items.filter((i) => !stale(i)), ...tag(fresh.items, fresh.obstacles.length)],
    nextZ: cursor.z,
    serial: cursor.serial,
    lastPowerZ: cursor.lastPowerZ,
    nextId: state.nextId + fresh.obstacles.length + fresh.items.length,
    seed: rng.seed(),
  };
};

const stepDrones = (state, dt) => {
  if (!state.obstacles.some((obstacle) => obstacle.kind === KIND.DRONE)) return state;
  const obstacles = state.obstacles.map((obstacle) => {
    if (obstacle.kind !== KIND.DRONE) return obstacle;
    const t = obstacle.t + dt;
    return { ...obstacle, t, lane: droneLane(obstacle.a, obstacle.b, t) };
  });
  return { ...state, obstacles };
};

// Com o ima ligado, as moedas a frente voam ate o robo.
const stepMagnet = (state, dt) => {
  if (state.magnetT <= 0) return state;
  const k = Math.min(1, CONFIG.magnetPull * dt);
  const center = playerCenter(state);
  const items = state.items.map((item) => {
    const ahead = item.z - state.distance;
    if (item.type !== ITEM.COIN || ahead < 0 || ahead > CONFIG.magnetRange) return item;
    return {
      ...item,
      lane: item.lane + (state.x - item.lane) * k,
      h: item.h + (center - item.h) * k,
      z: item.z - ahead * k,
      pulled: true,
    };
  });
  return { ...state, items };
};

export const touches = (state, item, prevDistance = state.distance) => {
  if (item.z < prevDistance - CONFIG.collectDepth || item.z > state.distance + CONFIG.collectDepth) return false;
  if (Math.abs(state.x - item.lane) > CONFIG.collectLane) return false;
  return item.type !== ITEM.COIN || Math.abs(playerCenter(state) - item.h) <= CONFIG.collectHeight;
};

const stepItems = (state, prevDistance, events) => {
  const taken = state.items.filter((item) => touches(state, item, prevDistance));
  if (taken.length === 0) return state;
  taken.forEach((item) => events.push({
    type: item.type === ITEM.COIN ? EVENT.COIN : EVENT.POWER, item: item.type, lane: item.lane, z: item.z, h: item.h,
  }));
  const has = (type) => taken.some((item) => item.type === type);
  return {
    ...state,
    items: state.items.filter((item) => !taken.includes(item)),
    coins: state.coins + taken.filter((item) => item.type === ITEM.COIN).length,
    magnetT: has(ITEM.MAGNET) ? CONFIG.magnetSeconds : state.magnetT,
    shield: state.shield || has(ITEM.SHIELD),
  };
};

/**
 * Regra de colisao de cada obstaculo. `prevDistance` evita atravessar obstaculos finos em alta velocidade.
 * Barreira baixa: so passa pulando. Viga alta: so passa deslizando. Bloco e drone: so trocando de faixa.
 */
export const hits = (state, obstacle, prevDistance = state.distance) => {
  const reach = HALF_DEPTH[obstacle.kind] + CONFIG.playerHalfDepth;
  if (obstacle.z + reach < prevDistance || obstacle.z - reach > state.distance) return false;
  if (Math.abs(state.x - obstacle.lane) >= CONFIG.laneHitWidth) return false;
  if (obstacle.kind === KIND.LOW) return state.y < CONFIG.lowClearHeight;
  if (obstacle.kind === KIND.HIGH) return !isSliding(state);
  return true;
};

const stepCollisions = (state, prevDistance, events) => {
  if (state.invulnT > 0) return state;
  const struck = state.obstacles.find((obstacle) => hits(state, obstacle, prevDistance));
  if (!struck) return state;
  if (state.shield) {
    events.push({ type: EVENT.SHIELD_BREAK, kind: struck.kind });
    return {
      ...state,
      shield: false,
      invulnT: CONFIG.shieldInvulnSeconds,
      obstacles: state.obstacles.filter((obstacle) => obstacle !== struck),
    };
  }
  events.push({ type: EVENT.CRASH, kind: struck.kind }, { type: EVENT.OVER, score: scoreOf(state) });
  return { ...state, phase: PHASE.OVER, best: Math.max(state.best, scoreOf(state)), buffer: null };
};

const stepOnce = (state, dt, events) => {
  const moved = stepMotion(state, dt, events);
  const world = stepMagnet(stepDrones(stepSpawns(moved), dt), dt);
  const collected = stepItems(world, state.distance, events);
  return stepCollisions(collected, state.distance, events);
};

/**
 * @param {object} state estado atual
 * @param {number} dt segundos desde o ultimo passo
 * @returns {{state: object, events: object[]}}
 */
export const step = (state, dt) => {
  if (state.phase !== PHASE.RUN || !(dt > 0)) return { state, events: [] };
  const events = [];
  let current = state;
  // Passos curtos e fixos: o resultado nao depende da taxa de quadros.
  for (let left = dt; left > 1e-9 && current.phase === PHASE.RUN; left -= CONFIG.simStepSeconds) {
    current = stepOnce(current, Math.min(left, CONFIG.simStepSeconds), events);
  }
  return { state: current, events };
};
