// Fisica de circulos baseada em posicao: gravidade, colisao entre corpos e com as paredes.
// A velocidade de cada passo sai do quanto o corpo realmente andou, por isso pilhas ficam paradas.
// `stepBodies` e pura: copia os corpos recebidos e so mexe nas copias.
import { CAPSULE, CONFIG, TIERS } from './config.js';

export const tierRadius = (tier) => TIERS[tier].radius;

// Um corpo nascido de fusao cresce do raio antigo ate o raio do novo nivel.
const grownRadius = (tier, fromRadius, age) => {
  const t = Math.min(1, age / CONFIG.growSeconds);
  return fromRadius + (tierRadius(tier) - fromRadius) * (1 - (1 - t) ** 3);
};

export const makeBody = (id, tier, x, y, extra = {}) => ({
  id, tier, x, y, vx: 0, vy: 0, rot: 0, w: 0, age: 0, r0: tierRadius(tier), r: tierRadius(tier), ...extra,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Limite de velocidade: nenhum corpo anda mais que o menor raio num passo.
const capSpeed = (vx, vy) => {
  const speed = Math.hypot(vx, vy);
  const k = speed > CONFIG.maxSpeed ? CONFIG.maxSpeed / speed : 1;
  return { vx: vx * k, vy: vy * k };
};

// Copia de trabalho: guarda a posicao anterior (px, py) para calcular a velocidade no fim.
const integrate = (body, dt) => {
  const damp = Math.max(0, 1 - CONFIG.linearDamping * dt);
  const { vx, vy } = capSpeed(body.vx * damp, (body.vy + CONFIG.gravity * dt) * damp);
  const age = body.age + dt;
  return {
    ...body,
    age,
    r: grownRadius(body.tier, body.r0, age),
    vx,
    vy,
    px: body.x,
    py: body.y,
    x: body.x + vx * dt,
    y: body.y + vy * dt,
    rot: body.rot + body.w * dt,
    w: clamp(body.w * Math.max(0, 1 - CONFIG.spinDamping * dt), -CONFIG.maxSpin, CONFIG.maxSpin),
  };
};

// As funcoes abaixo alteram apenas as copias de trabalho criadas por `integrate`.
const pushFromWalls = (body, hits) => {
  const { left, right, floor } = CAPSULE;
  if (body.x < left + body.r) {
    body.x = left + body.r;
    if (hits) hits.push({ body, nx: 1, ny: 0, speed: -body.vx });
  } else if (body.x > right - body.r) {
    body.x = right - body.r;
    if (hits) hits.push({ body, nx: -1, ny: 0, speed: body.vx });
  }
  if (body.y > floor - body.r) {
    body.y = floor - body.r;
    if (hits) hits.push({ body, nx: 0, ny: -1, speed: body.vy });
  }
};

const pushApart = (a, b, contacts) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const reach = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= reach * reach) return;
  const d = Math.sqrt(d2);
  // Dois corpos exatamente no mesmo ponto: separa na vertical.
  const nx = d > 1e-6 ? dx / d : 0;
  const ny = d > 1e-6 ? dy / d : 1;
  // O mais leve (menor area) cede mais.
  const ma = a.r * a.r;
  const mb = b.r * b.r;
  const wa = mb / (ma + mb);
  const wb = ma / (ma + mb);
  const push = Math.max(0, reach - d - CONFIG.slop) * CONFIG.correction;
  a.x -= nx * push * wa;
  a.y -= ny * push * wa;
  b.x += nx * push * wb;
  b.y += ny * push * wb;
  if (contacts) contacts.push({ a, b, nx, ny, wa, wb, vn: (b.vx - a.vx) * nx + (b.vy - a.vy) * ny });
};

const noteBump = (bumps, body, speed) => {
  if (speed > CONFIG.bumpSpeed) bumps.push({ id: body.id, x: body.x, y: body.y, power: speed });
};

// Depois de acertar as posicoes: quique nas batidas fortes, atrito e giro.
const respondPair = (contact, bumps) => {
  const { a, b, nx, ny, wa, wb, vn } = contact;
  noteBump(bumps, a, -vn * wa);
  noteBump(bumps, b, -vn * wb);
  const now = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  const j = -vn > CONFIG.bounceMinSpeed ? Math.max(0, -vn * CONFIG.restitution - now) : 0;
  const vt = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
  const jt = -vt * CONFIG.friction;
  a.vx -= nx * j * wa - ny * jt * wa;
  a.vy -= ny * j * wa + nx * jt * wa;
  b.vx += nx * j * wb - ny * jt * wb;
  b.vy += ny * j * wb + nx * jt * wb;
  a.w += (vt / a.r) * CONFIG.spinGrip * wa;
  b.w += (vt / b.r) * CONFIG.spinGrip * wb;
};

const respondWall = (hit, bumps) => {
  const { body, nx, ny, speed } = hit;
  noteBump(bumps, body, speed);
  if (speed > CONFIG.bounceMinSpeed) {
    body.vx += nx * speed * CONFIG.restitution;
    body.vy += ny * speed * CONFIG.restitution;
  }
  if (ny === 0) return;
  // No chao: atrito e rolamento.
  body.vx *= 1 - CONFIG.floorFriction;
  body.w += (body.vx / body.r - body.w) * CONFIG.spinGrip;
};

const finish = (body) => {
  const { px, py, ...rest } = body;
  return { ...rest, ...capSpeed(body.vx, body.vy) };
};

/**
 * @param {object[]} bodies corpos atuais (nao sao alterados)
 * @param {number} dt passo fixo em segundos
 * @returns {{bodies: object[], bumps: object[]}} corpos novos e as batidas fortes deste passo
 */
export const stepBodies = (bodies, dt) => {
  const work = bodies.map((body) => integrate(body, dt));
  const contacts = [];
  const hits = [];
  const bumps = [];
  for (let iteration = 0; iteration < CONFIG.iterations; iteration += 1) {
    const first = iteration === 0;
    for (let i = 0; i < work.length; i += 1) {
      for (let j = i + 1; j < work.length; j += 1) pushApart(work[i], work[j], first ? contacts : null);
    }
    work.forEach((body) => pushFromWalls(body, first ? hits : null));
  }
  work.forEach((body) => {
    body.vx = (body.x - body.px) / dt;
    body.vy = (body.y - body.py) / dt;
  });
  contacts.forEach((contact) => respondPair(contact, bumps));
  hits.forEach((hit) => respondWall(hit, bumps));
  return { bodies: work.map(finish), bumps };
};
