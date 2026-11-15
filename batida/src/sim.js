// Um teste de batida do comeco ao fim. Funcoes puras: estado entra, estado novo + eventos saem.
import { CONFIG, PHYS, kmhToMs } from './config.js';
import { TARGET_CAR } from './cars.js';
import { buildCar, carFrame, centerOf, regionStrain } from './carbody.js';
import { buildDummy, ejectDummy, JOINT } from './dummy.js';
import { prepareStatic } from './collide.js';
import { stepPhysics } from './physics.js';
import { nextRandom } from './rng.js';
import { pushFrame } from './replay.js';

export const EVENT = Object.freeze({
  RELEASE: 'release', IMPACT: 'impact', HIT: 'hit', SCRAPE: 'scrape', DETACH: 'detach',
  GLASS: 'glass', EJECT: 'eject', DONE: 'done',
});

export const SUB_DT = PHYS.stepSeconds / PHYS.substeps;
const LANDING_POWER = 9;
const MAX_SCRAPES = 3;
// Superficies por onde o carro anda: so contam como impacto numa queda forte.
const GROUND_KINDS = Object.freeze(['floor', 'ramp', 'cliff']);

const shiftBody = (body, dy) => ({ ...body, nodes: body.nodes.map((n) => ({ ...n, y: n.y + dy, py: n.py + dy })) });

export const runupFor = (speed) => (speed * speed) / (2 * CONFIG.driveAccel) + CONFIG.runupExtra;

export const createRun = ({ car, track, speedKmh, seed = 1 }) => {
  const speed = kmhToMs(Math.min(CONFIG.maxSpeedKmh, Math.max(CONFIG.minSpeedKmh, speedKmh)));
  const startFront = track.driveEnd - runupFor(speed);
  const player = shiftBody(buildCar(car, startFront, 1), track.groundTop ?? 0);
  const bodies = [player];
  const soft = [car.soft];
  if (track.target) {
    bodies.push(buildCar(TARGET_CAR, track.target.front, -1));
    soft.push(TARGET_CAR.soft);
  }
  const world = {
    bodies,
    soft,
    dummies: car.seats.map((seatX, i) => buildDummy(player, seatX, i)),
    props: track.props.map((p) => ({ ...p, px: p.x, py: p.y, w: p.kind === 'cone' ? 1 / 30 : 1 / 70, touch: false })),
    debris: [],
    statics: track.statics.map(prepareStatic),
    brake: false,
  };
  return {
    phase: 'drive', t: 0, speed, car, track, world, seed: seed >>> 0 || 1,
    history: [{ vx: 0, vy: 0 }], releaseT: null, impactT: null, settleT: 0, done: false,
    stats: { rot: 0, angle: carFrame(player).angle, air: 0, ejected: 0, parts: 0, glass: false },
    replay: pushFrame({ frames: [], cap: Math.round(CONFIG.replaySeconds / PHYS.stepSeconds) }, world),
  };
};

const runSubsteps = (state) => {
  let { world } = state;
  const hit = { power: 0, x: 0, y: 0, kind: '' };
  const scrapes = [];
  let touched = false;
  const drive = state.phase === 'drive' ? { speed: state.speed, accel: CONFIG.driveAccel } : null;
  for (let i = 0; i < PHYS.substeps; i += 1) {
    const result = stepPhysics(world, SUB_DT, drive);
    world = result.world;
    if (result.hit.power > hit.power) Object.assign(hit, result.hit);
    if (scrapes.length < MAX_SCRAPES) scrapes.push(...result.hit.scrapes.slice(0, MAX_SCRAPES - scrapes.length));
    if (world.bodies[0].nodes.some((n) => n.touch)) touched = true;
  }
  return { world, hit, scrapes, touched };
};

const releaseTarget = (world, state) => {
  if (!state.track.target || world.bodies.length < 2) return world;
  const move = state.track.target.speed * SUB_DT;
  const target = world.bodies[1];
  const moving = { ...target, nodes: target.nodes.map((n) => ({ ...n, px: n.x + move, py: n.y })) };
  return { ...world, bodies: [world.bodies[0], moving] };
};

const detachPart = (world, part, seed) => {
  const body = world.bodies[0];
  const parts = body.parts.map((p) => (p === part ? { ...p, on: false } : p));
  if (part.kind === 'wheel') {
    const springs = body.springs.map((s) => (s.wheel === part.wheel ? { ...s, broken: true } : s));
    const nodes = body.nodes.map((n, i) => (i === part.node ? { ...n, loose: true } : n));
    return { world: { ...world, bodies: [{ ...body, parts, springs, nodes }, ...world.bodies.slice(1)] }, seed };
  }
  const r1 = nextRandom(seed);
  const r2 = nextRandom(r1.seed);
  const kick = (r1.value - 0.5) * 0.04;
  const lift = -0.02 - r2.value * 0.03;
  const a = body.nodes[part.a];
  const b = body.nodes[part.b];
  const piece = {
    kind: part.kind, hue: 0,
    a: { x: a.x, y: a.y, px: a.px - kick, py: a.py - lift, w: 1 / 15, r: 0.08, touch: false },
    b: { x: b.x, y: b.y, px: b.px + kick, py: b.py - lift * 0.5, w: 1 / 15, r: 0.08, touch: false },
    rest: Math.hypot(b.x - a.x, b.y - a.y),
  };
  return {
    world: { ...world, bodies: [{ ...body, parts }, ...world.bodies.slice(1)], debris: [...world.debris, piece] },
    seed: r2.seed,
  };
};

const checkParts = (state, world, events) => {
  let next = world;
  let { seed } = state;
  let count = 0;
  world.bodies[0].parts.forEach((part) => {
    if (!part.on) return;
    if (regionStrain(world.bodies[0], part.c0, part.c1) <= CONFIG.partStrain[part.kind]) return;
    const current = next.bodies[0].parts.find((p) => p.id === part.id);
    const result = detachPart(next, current, seed);
    next = result.world;
    seed = result.seed;
    count += 1;
    const node = part.kind === 'wheel' ? next.bodies[0].nodes[part.node] : next.bodies[0].nodes[part.a];
    events.push({ type: EVENT.DETACH, part: part.kind, x: node.x, y: node.y });
  });
  return { world: next, seed, count };
};

const shatter = (world, events) => {
  const body = world.bodies[0];
  const [a, b] = state0Cabin(body);
  events.push({ type: EVENT.GLASS, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return { ...world, bodies: [{ ...body, glass: false }, ...world.bodies.slice(1)] };
};

const state0Cabin = (body) => [body.nodes[2 * 8 + 2], body.nodes[2 * 8 + 5]];

const ejectAll = (world, lastV, events) => {
  const vx = lastV.vx * CONFIG.ejectCarry;
  const vy = lastV.vy * CONFIG.ejectCarry - CONFIG.ejectLift * SUB_DT;
  let count = 0;
  const dummies = world.dummies.map((d) => {
    if (!d.attached) return d;
    count += 1;
    const out = ejectDummy(d, vx, vy);
    events.push({ type: EVENT.EJECT, x: out.nodes[JOINT.HEAD].x, y: out.nodes[JOINT.HEAD].y });
    return out;
  });
  return { world: { ...world, dummies }, count };
};

const trackDummies = (world) => ({
  ...world,
  dummies: world.dummies.map((d) => (d.attached ? d : {
    ...d, farthest: Math.max(d.farthest, Math.abs(d.nodes[JOINT.PELVIS].x - d.ejectX)),
  })),
});

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Avanca um passo fixo (PHYS.stepSeconds). Nao altera `state`.
 * @returns {{ state: object, events: object[] }}
 */
export const stepRun = (state) => {
  if (state.done) return { state, events: [] };
  const dt = PHYS.stepSeconds;
  const events = [];
  const t = state.t + dt;
  const sub = runSubsteps(state);
  let { world } = sub;
  let { phase, releaseT, impactT, seed } = state;
  const stats = { ...state.stats };

  const front = Math.max(...world.bodies[0].nodes.map((n) => n.x));
  if (phase === 'drive' && front >= state.track.driveEnd) {
    phase = 'free';
    releaseT = t;
    world = releaseTarget(world, state);
    events.push({ type: EVENT.RELEASE });
  }
  const free = phase === 'free';
  if (free && !world.brake && t - releaseT > CONFIG.brakeAfter) world = { ...world, brake: true };
  const center = centerOf(world.bodies[0]);
  const v = { vx: center.vx, vy: center.vy };
  const history = [...state.history.slice(-(CONFIG.ejectWindow - 1)), v];
  const oldest = history[0];
  const deltaV = Math.hypot(v.vx - oldest.vx, v.vy - oldest.vy) / SUB_DT;

  const ground = GROUND_KINDS.includes(sub.hit.kind);
  const strongFloor = ground && sub.hit.power > LANDING_POWER;
  if (free && impactT === null && sub.hit.power > PHYS.hitSpeed && (!ground || strongFloor)) {
    impactT = t;
    world = { ...world, brake: true };
    events.push({ type: EVENT.IMPACT, x: sub.hit.x, y: sub.hit.y, power: sub.hit.power });
  } else if (free && sub.hit.power > PHYS.hitSpeed) {
    events.push({ type: EVENT.HIT, x: sub.hit.x, y: sub.hit.y, power: sub.hit.power });
  }
  sub.scrapes.forEach((s) => events.push({ type: EVENT.SCRAPE, x: s.x, y: s.y }));

  if (free && deltaV > CONFIG.ejectDeltaV && world.dummies.some((d) => d.attached)) {
    const result = ejectAll(world, oldest, events);
    world = result.world;
    stats.ejected += result.count;
  }
  if (free) {
    const parts = checkParts({ ...state, seed }, world, events);
    world = parts.world;
    seed = parts.seed;
    stats.parts += parts.count;
    const [cabA, cabB] = state.car.cabin;
    const cabinHit = regionStrain(world.bodies[0], cabA, Math.min(7, cabB + 1)) > CONFIG.glassStrain;
    if (world.bodies[0].glass && (cabinHit || stats.ejected > 0)) {
      world = shatter(world, events);
      stats.glass = true;
    }
    const angle = carFrame(world.bodies[0]).angle;
    stats.rot += wrapAngle(angle - stats.angle);
    stats.angle = angle;
    if (!sub.touched) stats.air += dt;
  }
  world = trackDummies(world);

  const speed = Math.hypot(v.vx, v.vy) / SUB_DT;
  const settleT = free && speed < CONFIG.settleSpeed ? state.settleT + dt : 0;
  const crashFor = impactT === null ? 0 : t - impactT;
  const done = (impactT !== null && (settleT >= CONFIG.settleSeconds || crashFor > CONFIG.maxCrashSeconds))
    || (releaseT !== null && impactT === null && t - releaseT > CONFIG.noCrashSeconds && settleT > 0)
    || t > CONFIG.maxRunSeconds;
  if (done) events.push({ type: EVENT.DONE });

  const recording = impactT === null || crashFor <= CONFIG.replayAfterImpact;
  return {
    state: {
      ...state, t, phase, world, seed, releaseT, impactT, settleT, done, stats, history,
      replay: recording ? pushFrame(state.replay, world) : state.replay,
    },
    events,
  };
};
