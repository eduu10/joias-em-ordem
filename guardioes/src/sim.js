// Simulacao do jogo. Funcoes puras: recebem um estado e devolvem um novo, mais a lista do que aconteceu.
import { CONFIG, PHASE, SLOTS } from './config.js';
import { PATH_LENGTH, pathPoint } from './path.js';

export const EVENT = Object.freeze({
  SHOT: 'shot', HIT: 'hit', KILL: 'kill', LEAK: 'leak', WAVE_START: 'waveStart', WAVE_CLEAR: 'waveClear', OVER: 'over',
});

export const heroDamage = (tier) => CONFIG.heroDamage * CONFIG.heroDamageGrowth ** (tier - 1);
export const heroRange = (tier) => CONFIG.heroRange + CONFIG.heroRangePerTier * tier;
export const buyCost = (bought) => Math.round(CONFIG.buyBaseCost * CONFIG.buyCostGrowth ** bought);
export const isBossWave = (wave) => wave % CONFIG.bossEvery === 0;

export const waveSpec = (wave) => ({
  count: Math.min(CONFIG.enemyCountCap, CONFIG.enemyCount + CONFIG.enemyCountPerWave * wave),
  hp: Math.round(CONFIG.enemyHp * CONFIG.enemyHpGrowth ** (wave - 1)),
  speed: CONFIG.enemySpeed + Math.min(CONFIG.enemySpeedBonusCap, CONFIG.enemySpeedPerWave * wave),
  reward: CONFIG.rewardBase + Math.floor(wave / CONFIG.wavesPerRewardStep),
  interval: Math.max(CONFIG.spawnIntervalMin, CONFIG.spawnInterval - CONFIG.spawnIntervalPerWave * wave),
});

export const createState = (best = 0) => ({
  phase: PHASE.TITLE,
  wave: 1,
  timer: CONFIG.firstBuildSeconds,
  toSpawn: 0,
  spawnT: 0,
  coins: CONFIG.startCoins,
  bought: 0,
  baseHp: CONFIG.baseHp,
  revived: false,
  best,
  heroes: SLOTS.map(() => null),
  enemies: [],
  shots: [],
  nextId: 1,
});

export const startRun = (state) => ({ ...createState(state.best), phase: PHASE.BUILD });

// Volta a onda atual com o castelo inteiro. Vale uma vez por partida.
export const revive = (state) => {
  if (state.phase !== PHASE.OVER || state.revived) return state;
  return {
    ...state,
    phase: PHASE.BUILD,
    timer: CONFIG.buildSeconds,
    baseHp: CONFIG.baseHp,
    revived: true,
    toSpawn: 0,
    enemies: [],
    shots: [],
  };
};

const playing = (state) => state.phase === PHASE.BUILD || state.phase === PHASE.WAVE;

export const canBuy = (state) =>
  playing(state) && state.coins >= buyCost(state.bought) && state.heroes.includes(null);

export const buyHero = (state) => {
  if (!canBuy(state)) return { state, slot: -1 };
  const slot = state.heroes.indexOf(null);
  return {
    slot,
    state: {
      ...state,
      coins: state.coins - buyCost(state.bought),
      bought: state.bought + 1,
      heroes: state.heroes.map((hero, index) => (index === slot ? { tier: 1, cd: 0 } : hero)),
    },
  };
};

export const canMerge = (state, from, to) => {
  const a = state.heroes[from];
  const b = state.heroes[to];
  return from !== to && Boolean(a) && Boolean(b) && a.tier === b.tier && a.tier < CONFIG.maxTier;
};

// Arrastar um guardiao: junta com outro igual, troca de lugar com um diferente ou ocupa um pedestal vazio.
export const moveHero = (state, from, to) => {
  const hero = state.heroes[from];
  if (!playing(state) || !hero || from === to || to < 0 || to >= state.heroes.length) {
    return { state, merged: false };
  }
  const merged = canMerge(state, from, to);
  const target = state.heroes[to];
  const heroes = state.heroes.map((current, index) => {
    if (index === from) return merged ? null : target;
    if (index === to) return merged ? { tier: hero.tier + 1, cd: 0 } : hero;
    return current;
  });
  return { state: { ...state, heroes }, merged };
};

const spawnEnemy = (state, spec) => {
  const boss = isBossWave(state.wave) && state.toSpawn === 1;
  const hp = boss ? spec.hp * CONFIG.bossHpFactor : spec.hp;
  return {
    id: state.nextId,
    d: 0,
    hp,
    maxHp: hp,
    speed: boss ? spec.speed * CONFIG.bossSpeedFactor : spec.speed,
    reward: boss ? spec.reward * CONFIG.bossRewardFactor : spec.reward,
    boss,
  };
};

const stepSpawns = (state, dt, events) => {
  if (state.phase === PHASE.BUILD) {
    const timer = state.timer - dt;
    if (timer > 0) return { ...state, timer };
    events.push({ type: EVENT.WAVE_START, wave: state.wave });
    return { ...state, phase: PHASE.WAVE, timer: 0, toSpawn: waveSpec(state.wave).count, spawnT: 0 };
  }
  if (state.toSpawn === 0) return state;
  const spawnT = state.spawnT - dt;
  if (spawnT > 0) return { ...state, spawnT };
  const spec = waveSpec(state.wave);
  return {
    ...state,
    enemies: [...state.enemies, spawnEnemy(state, spec)],
    nextId: state.nextId + 1,
    toSpawn: state.toSpawn - 1,
    spawnT: spawnT + spec.interval,
  };
};

const stepEnemies = (state, dt, events) => {
  const moved = state.enemies.map((enemy) => ({ ...enemy, d: enemy.d + enemy.speed * dt }));
  const leaked = moved.filter((enemy) => enemy.d >= PATH_LENGTH);
  leaked.forEach((enemy) => events.push({ type: EVENT.LEAK, boss: enemy.boss }));
  const damage = leaked.reduce((sum, enemy) => sum + (enemy.boss ? CONFIG.bossLeakDamage : 1), 0);
  return {
    ...state,
    enemies: moved.filter((enemy) => enemy.d < PATH_LENGTH),
    baseHp: Math.max(0, state.baseHp - damage),
  };
};

const pickTarget = (enemies, slot, range) => {
  let best = null;
  for (const enemy of enemies) {
    const point = pathPoint(enemy.d);
    if (Math.hypot(point.x - slot.x, point.y - slot.y) > range) continue;
    if (!best || enemy.d > best.d) best = enemy;
  }
  return best;
};

const stepHeroes = (state, dt, events) => {
  const shots = [];
  const heroes = state.heroes.map((hero, index) => {
    if (!hero) return null;
    const cd = hero.cd - dt;
    if (cd > 0) return { ...hero, cd };
    const slot = SLOTS[index];
    const target = pickTarget(state.enemies, slot, heroRange(hero.tier));
    if (!target) return { ...hero, cd: 0 };
    shots.push({ x: slot.x, y: slot.y - 14, targetId: target.id, damage: heroDamage(hero.tier), tier: hero.tier });
    events.push({ type: EVENT.SHOT, slot: index, tier: hero.tier });
    return { ...hero, cd: CONFIG.heroCooldown };
  });
  return { ...state, heroes, shots: [...state.shots, ...shots] };
};

const stepShots = (state, dt, events) => {
  const byId = new Map(state.enemies.map((enemy) => [enemy.id, enemy]));
  const damageById = new Map();
  const shots = [];
  for (const shot of state.shots) {
    const target = byId.get(shot.targetId);
    if (!target) continue;
    const point = pathPoint(target.d);
    const distance = Math.hypot(point.x - shot.x, point.y - shot.y);
    const reach = CONFIG.shotSpeed * dt;
    if (distance <= reach) {
      damageById.set(target.id, (damageById.get(target.id) ?? 0) + shot.damage);
      events.push({ type: EVENT.HIT, x: point.x, y: point.y, tier: shot.tier });
      continue;
    }
    shots.push({ ...shot, x: shot.x + ((point.x - shot.x) / distance) * reach, y: shot.y + ((point.y - shot.y) / distance) * reach });
  }
  const hurt = state.enemies.map((enemy) =>
    (damageById.has(enemy.id) ? { ...enemy, hp: enemy.hp - damageById.get(enemy.id) } : enemy));
  const dead = hurt.filter((enemy) => enemy.hp <= 0);
  dead.forEach((enemy) => {
    const point = pathPoint(enemy.d);
    events.push({ type: EVENT.KILL, x: point.x, y: point.y, reward: enemy.reward, boss: enemy.boss });
  });
  return {
    ...state,
    shots,
    enemies: hurt.filter((enemy) => enemy.hp > 0),
    coins: state.coins + dead.reduce((sum, enemy) => sum + enemy.reward, 0),
  };
};

const stepOutcome = (state, events) => {
  if (state.baseHp <= 0) {
    events.push({ type: EVENT.OVER, wave: state.wave });
    return { ...state, phase: PHASE.OVER, best: Math.max(state.best, state.wave - 1), shots: [] };
  }
  if (state.phase === PHASE.WAVE && state.toSpawn === 0 && state.enemies.length === 0) {
    const bonus = CONFIG.waveBonus + CONFIG.waveBonusPerWave * state.wave;
    events.push({ type: EVENT.WAVE_CLEAR, wave: state.wave, bonus });
    return {
      ...state,
      phase: PHASE.BUILD,
      timer: CONFIG.buildSeconds,
      wave: state.wave + 1,
      coins: state.coins + bonus,
      best: Math.max(state.best, state.wave),
    };
  }
  return state;
};

/**
 * @param {object} state estado atual
 * @param {number} dt segundos desde o ultimo passo
 * @returns {{state: object, events: object[]}}
 */
export const step = (state, dt) => {
  if (!playing(state)) return { state, events: [] };
  const events = [];
  const spawned = stepSpawns(state, dt, events);
  const moved = stepEnemies(spawned, dt, events);
  const fired = stepHeroes(moved, dt, events);
  const resolved = stepShots(fired, dt, events);
  return { state: stepOutcome(resolved, events), events };
};
