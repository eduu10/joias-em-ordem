// Um subpasso de fisica baseada em posicao (Verlet + restricoes). Pura: copia o mundo e so mexe na copia.
import { PHYS } from './config.js';
import { collideFloor, collidePair, collidePoly, solveLink } from './collide.js';
import { LINKS, followSeat } from './dummy.js';

const copyPoint = (p) => ({ ...p, touch: false });

const cloneWorld = (world) => ({
  ...world,
  bodies: world.bodies.map((b) => ({ ...b, nodes: b.nodes.map(copyPoint), springs: b.springs.map((s) => ({ ...s })) })),
  dummies: world.dummies.map((d) => (d.attached ? d : { ...d, nodes: d.nodes.map(copyPoint) })),
  props: world.props.map(copyPoint),
  debris: world.debris.map((d) => ({ ...d, a: copyPoint(d.a), b: copyPoint(d.b) })),
});

const integrate = (p, dt) => {
  const damp = 1 - PHYS.damping * dt;
  let vx = (p.x - p.px) * damp;
  let vy = (p.y - p.py) * damp;
  const max = PHYS.maxSpeed * dt;
  const speed = Math.hypot(vx, vy);
  if (speed > max) {
    vx *= max / speed;
    vy *= max / speed;
  }
  p.px = p.x;
  p.py = p.y;
  p.x += vx;
  p.y += vy + PHYS.gravity * dt * dt;
};

// Motor: empurra todo o carro ate a velocidade alvo (m/s).
const applyDrive = (body, drive, dt) => {
  let sum = 0;
  body.nodes.forEach((n) => { sum += n.x - n.px; });
  const avg = (sum / body.nodes.length) * body.dir;
  const want = drive.speed * dt;
  if (avg >= want) return;
  const add = Math.min(drive.accel * dt * dt, want - avg) * body.dir;
  body.nodes.forEach((n) => { n.x += add; });
};

const frictionOf = (node, brake) => {
  if (node.kind !== 'wheel') return PHYS.bodyFriction;
  return brake || node.loose ? PHYS.brakeFriction : PHYS.rollFriction;
};

const solveSprings = (body) => {
  const { nodes } = body;
  for (const s of body.springs) {
    if (!s.broken) solveLink(nodes[s.a], nodes[s.b], s.rest, s.k);
  }
};

// Deformacao permanente: alem do limite elastico, o comprimento de repouso acompanha a mola.
const applyPlasticity = (body, soft) => {
  const { nodes } = body;
  for (const s of body.springs) {
    if (s.group !== 'body') continue;
    const a = nodes[s.a];
    const b = nodes[s.b];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const strain = (len - s.rest) / s.rest;
    if (Math.abs(strain) <= PHYS.yieldStrain) continue;
    const target = len - Math.sign(strain) * PHYS.yieldStrain * s.rest;
    const next = s.rest + (target - s.rest) * PHYS.plasticRate * soft;
    s.rest = Math.min(s.rest0 * PHYS.maxRest, Math.max(s.rest0 * PHYS.minRest, next));
  }
};

const record = (sink, result, p, kind, dt) => {
  if (!result || !sink) return;
  const power = result.approach / dt;
  if (power > sink.power) Object.assign(sink, { power, x: p.x, y: p.y, kind });
  if (p.kind === 'body' && result.slide / dt > PHYS.scrapeSpeed) sink.scrapes.push({ x: p.x, y: p.y });
};

const collideStatic = (p, statics, mu, sink, dt) => {
  record(sink, collideFloor(p, mu), p, 'floor', dt);
  for (const shape of statics) record(sink, collidePoly(p, shape, mu), p, shape.kind, dt);
};

const collideAll = (w, sink, dt, isLast) => {
  const [car, other] = w.bodies;
  const brake = w.brake;
  w.bodies.forEach((body) => body.nodes.forEach((n) => collideStatic(n, w.statics, frictionOf(n, brake), sink, dt)));
  w.dummies.forEach((d) => { if (!d.attached) d.nodes.forEach((n) => collideStatic(n, w.statics, PHYS.dummyFriction, null, dt)); });
  w.props.forEach((p) => collideStatic(p, w.statics, PHYS.propFriction, null, dt));
  w.debris.forEach((d) => { collideStatic(d.a, w.statics, PHYS.propFriction, null, dt); collideStatic(d.b, w.statics, PHYS.propFriction, null, dt); });
  const mu = isLast ? 0.3 : 0;
  const note = (approach, p) => {
    const power = approach / dt;
    if (sink && power > sink.power) Object.assign(sink, { power, x: p.x, y: p.y, kind: 'body' });
  };
  if (other) {
    for (const a of car.nodes) for (const b of other.nodes) note(collidePair(a, a.cr, b, b.cr, mu), a);
  }
  for (let i = 0; i < w.props.length; i += 1) {
    const p = w.props[i];
    w.bodies.forEach((body) => body.nodes.forEach((n) => note(collidePair(n, n.cr, p, p.r, mu), p)));
    for (let j = i + 1; j < w.props.length; j += 1) collidePair(p, p.r, w.props[j], w.props[j].r, 0.2);
  }
};

const silentSink = () => ({ power: 0, x: 0, y: 0, kind: '', scrapes: [] });

/**
 * @param {object} world mundo atual (nao e alterado)
 * @param {number} dt duracao do subpasso
 * @param {object|null} drive { speed, accel } enquanto o motor empurra o carro 0
 * @returns {{ world: object, hit: object }}
 */
export const stepPhysics = (world, dt, drive) => {
  const w = cloneWorld(world);
  w.bodies.forEach((b) => b.nodes.forEach((n) => integrate(n, dt)));
  w.dummies.forEach((d) => { if (!d.attached) d.nodes.forEach((n) => integrate(n, dt)); });
  w.props.forEach((p) => integrate(p, dt));
  w.debris.forEach((d) => { integrate(d.a, dt); integrate(d.b, dt); });
  if (drive) applyDrive(w.bodies[0], drive, dt);

  const sink = silentSink();
  for (let it = 0; it < PHYS.iterations; it += 1) {
    w.bodies.forEach(solveSprings);
    w.dummies.forEach((d) => {
      if (!d.attached) LINKS.forEach(([a, b, k], i) => solveLink(d.nodes[a], d.nodes[b], d.rest[i], k));
    });
    w.debris.forEach((d) => solveLink(d.a, d.b, d.rest, 1));
    collideAll(w, it === 0 ? sink : null, dt, it === PHYS.iterations - 1);
  }
  w.bodies.forEach((b, i) => applyPlasticity(b, w.soft[i]));
  w.dummies = w.dummies.map((d) => (d.attached ? followSeat(d, w.bodies[0]) : d));
  return { world: w, hit: sink };
};

// Energia cinetica por unidade de massa somada sobre todos os pontos moveis (m^2/s^2).
export const kineticEnergy = (world, dt) => {
  let sum = 0;
  const add = (p) => {
    if (p.w <= 0) return;
    const vx = (p.x - p.px) / dt;
    const vy = (p.y - p.py) / dt;
    sum += (0.5 * (vx * vx + vy * vy)) / p.w;
  };
  world.bodies.forEach((b) => b.nodes.forEach(add));
  world.dummies.forEach((d) => d.nodes.forEach(add));
  world.props.forEach(add);
  return sum;
};
