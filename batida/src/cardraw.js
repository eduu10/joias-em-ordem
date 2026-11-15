// Desenho dos carros (carroceria macia com brilho e amassados), rodas, bonecos, objetos e destrocos. So desenha.
import { COLS, nodeIndex } from './carbody.js';
import { JOINT } from './dummy.js';
import { toScreen } from './camera.js';

const TAU = Math.PI * 2;

const pts = (cam, body) => body.nodes.map((n) => toScreen(cam, n.x, n.y));

const pathOf = (ctx, list) => {
  ctx.beginPath();
  list.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};

const at = (p, row, col) => p[nodeIndex(row, col)];

const outline = (p) => {
  const list = [];
  for (let c = 0; c < COLS; c += 1) list.push(at(p, 0, c));
  for (let c = COLS - 1; c >= 0; c -= 1) list.push(at(p, 2, c));
  return list;
};

const cellStrain = (body, row, col) => {
  let sum = 0;
  let count = 0;
  body.springs.forEach((s) => {
    if (s.group !== 'body' || s.c0 !== col || s.c1 !== col + 1) return;
    const r0 = Math.floor(s.a / COLS);
    const r1 = Math.floor(s.b / COLS);
    if (Math.min(r0, r1) !== row && Math.max(r0, r1) !== row + 1) return;
    sum += Math.abs(s.rest - s.rest0) / s.rest0;
    count += 1;
  });
  return count ? sum / count : 0;
};

const quad = (p, row, col) => [at(p, row, col), at(p, row, col + 1), at(p, row + 1, col + 1), at(p, row + 1, col)];

const colors = (def) => {
  const sat = def.gray ? 6 : 78;
  return {
    light: `hsl(${def.hue} ${sat}% 66%)`, mid: `hsl(${def.hue} ${sat}% 50%)`, dark: `hsl(${def.hue} ${sat}% 30%)`,
  };
};

const drawWheel = (ctx, cam, node, r) => {
  const [x, y] = toScreen(cam, node.x, node.y);
  const R = r * cam.ppm;
  const spin = node.x / r;
  ctx.fillStyle = '#1b1c20';
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  const rim = ctx.createRadialGradient(x - R * 0.2, y - R * 0.2, 1, x, y, R * 0.62);
  rim.addColorStop(0, '#f4f6f8');
  rim.addColorStop(1, '#8c949c');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, R * 0.6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#596068';
  ctx.lineWidth = Math.max(1, R * 0.12);
  for (let i = 0; i < 5; i += 1) {
    const a = spin + (i * TAU) / 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55);
    ctx.stroke();
  }
  ctx.fillStyle = '#2b2f34';
  ctx.beginPath();
  ctx.arc(x, y, R * 0.14, 0, TAU);
  ctx.fill();
};

// Marca de teste original: circulo com quadrantes amarelo e preto.
const drawMarker = (ctx, x, y, r) => {
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = i % 2 ? '#141414' : '#ffd21f';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, (i * TAU) / 4, ((i + 1) * TAU) / 4);
    ctx.fill();
  }
};

const drawDummyShape = (ctx, cam, dummy) => {
  const p = dummy.nodes.map((n) => toScreen(cam, n.x, n.y));
  const w = Math.max(2, cam.ppm * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const limb = (list, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    list.forEach((i, k) => (k ? ctx.lineTo(p[i][0], p[i][1]) : ctx.moveTo(p[i][0], p[i][1])));
    ctx.stroke();
  };
  limb([JOINT.PELVIS, JOINT.KNEE, JOINT.FOOT], w * 1.2, '#222');
  limb([JOINT.PELVIS, JOINT.KNEE, JOINT.FOOT], w * 0.9, '#f2c230');
  limb([JOINT.CHEST, JOINT.PELVIS], w * 1.9, '#222');
  limb([JOINT.CHEST, JOINT.PELVIS], w * 1.6, '#f2c230');
  limb([JOINT.CHEST, JOINT.ELBOW, JOINT.HAND], w * 1.1, '#222');
  limb([JOINT.CHEST, JOINT.ELBOW, JOINT.HAND], w * 0.8, '#ffd84a');
  [JOINT.KNEE, JOINT.ELBOW].forEach((i) => {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(p[i][0], p[i][1], w * 0.45, 0, TAU);
    ctx.fill();
  });
  const [hx, hy] = p[JOINT.HEAD];
  ctx.fillStyle = '#ffd84a';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hx, hy, w * 1.25, 0, TAU);
  ctx.fill();
  ctx.stroke();
  drawMarker(ctx, hx, hy, w * 0.6);
};

const drawWindows = (ctx, p, def, body, dummies, cam) => {
  const [a, b] = def.cabin;
  const cells = [];
  for (let c = a; c < Math.max(a + 1, b); c += 1) cells.push(quad(p, 1, c));
  ctx.save();
  ctx.beginPath();
  cells.forEach((q) => q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))));
  ctx.clip();
  ctx.fillStyle = '#26323d';
  ctx.fillRect(0, 0, cam.w, cam.h);
  dummies.forEach((d) => { if (d.attached) drawDummyShape(ctx, cam, d); });
  if (body.glass) {
    const top = Math.min(...cells.flat().map((q) => q[1]));
    const g = ctx.createLinearGradient(0, top, 0, top + cam.ppm);
    g.addColorStop(0, 'rgba(190, 230, 255, 0.75)');
    g.addColorStop(1, 'rgba(90, 150, 200, 0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cam.w, cam.h);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(20, 20, 30, 0.7)';
  ctx.lineWidth = Math.max(1, cam.ppm * 0.06);
  cells.forEach((q) => { pathOf(ctx, q); ctx.stroke(); });
};

const drawPanels = (ctx, p, body, def, cam, c) => {
  const lw = Math.max(1, cam.ppm * 0.05);
  body.parts.forEach((part) => {
    if (part.kind === 'bumper' && part.on) {
      ctx.strokeStyle = '#2a2d33';
      ctx.lineWidth = cam.ppm * 0.18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(...p[part.a]);
      ctx.lineTo(...p[part.b]);
      ctx.stroke();
    } else if (part.kind === 'hood' && !part.on) {
      ctx.fillStyle = '#3b3f45';
      for (let col = part.c0; col < part.c1; col += 1) { pathOf(ctx, quad(p, 0, col)); ctx.fill(); }
    } else if (part.kind === 'door') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = lw;
      for (let col = part.c0; col < part.c1; col += 1) {
        pathOf(ctx, quad(p, 0, col));
        if (part.on) ctx.stroke();
        else { ctx.fillStyle = '#30343a'; ctx.fill(); }
      }
      if (part.on) {
        const q = quad(p, 0, part.c0);
        drawMarker(ctx, (q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, cam.ppm * 0.16);
      }
    }
  });
  ctx.fillStyle = c.light;
};

const drawLights = (ctx, p, cam, dir) => {
  const front = at(p, 1, COLS - 1);
  const rear = at(p, 1, 0);
  const s = cam.ppm * 0.12;
  ctx.fillStyle = '#fff6c2';
  ctx.beginPath();
  ctx.arc(front[0] - dir * s * 0.6, front[1] + s, s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(rear[0] - s * 0.5 + dir * s * 0.4, rear[1] + s * 0.2, s, s * 1.6);
};

export const drawCar = (ctx, cam, body, def, dummies = []) => {
  const p = pts(cam, body);
  const c = colors(def);
  body.nodes.forEach((n, i) => { if (n.kind === 'wheel' && n.loose) drawWheel(ctx, cam, n, n.r); });
  const shape = outline(p);
  const ys = shape.map((q) => q[1]);
  const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, c.light);
  g.addColorStop(0.45, c.mid);
  g.addColorStop(1, c.dark);
  pathOf(ctx, shape);
  ctx.fillStyle = g;
  ctx.fill();
  // Amassados escurecem a pintura.
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < COLS - 1; col += 1) {
      const dent = Math.min(0.65, cellStrain(body, row, col) * 4);
      if (dent < 0.04) continue;
      ctx.fillStyle = `rgba(20, 10, 10, ${dent})`;
      pathOf(ctx, quad(p, row, col));
      ctx.fill();
    }
  }
  drawPanels(ctx, p, body, def, cam, c);
  drawWindows(ctx, p, def, body, dummies, cam);
  // Brilho no teto e na linha de cintura.
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(1.5, cam.ppm * 0.07);
  ctx.beginPath();
  for (let col = 0; col < COLS; col += 1) {
    const [x, y] = at(p, 2, col);
    if (col) ctx.lineTo(x, y + 2);
    else ctx.moveTo(x, y + 2);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  for (let col = 0; col < COLS; col += 1) {
    const [x, y] = at(p, 1, col);
    if (col) ctx.lineTo(x, y + 3);
    else ctx.moveTo(x, y + 3);
  }
  ctx.stroke();
  drawLights(ctx, p, cam, body.dir);
  ctx.strokeStyle = 'rgba(15, 15, 20, 0.75)';
  ctx.lineWidth = Math.max(1, cam.ppm * 0.05);
  pathOf(ctx, shape);
  ctx.stroke();
  body.nodes.forEach((n) => { if (n.kind === 'wheel' && !n.loose) drawWheel(ctx, cam, n, n.r); });
};

export const drawDummies = (ctx, cam, dummies) => dummies.forEach((d) => { if (!d.attached) drawDummyShape(ctx, cam, d); });

export const drawProps = (ctx, cam, props) => props.forEach((p) => {
  const [x, y] = toScreen(cam, p.x, p.y);
  const r = p.r * cam.ppm;
  if (p.kind === 'cone') {
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.6);
    ctx.lineTo(x + r * 0.8, y + r);
    ctx.lineTo(x - r * 0.8, y + r);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - r * 0.45, y - r * 0.2, r * 0.9, r * 0.35);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createLinearGradient(-r, 0, r, 0);
  g.addColorStop(0, '#1f5fbf');
  g.addColorStop(0.4, '#4f97ff');
  g.addColorStop(1, '#173f80');
  ctx.fillStyle = g;
  ctx.fillRect(-r * 0.9, -r, r * 1.8, r * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-r * 0.9, -r * 0.4, r * 1.8, r * 0.12);
  ctx.fillRect(-r * 0.9, r * 0.3, r * 1.8, r * 0.12);
  ctx.restore();
});

export const drawDebris = (ctx, cam, debris, def) => {
  const c = colors(def);
  debris.forEach((d) => {
    const a = toScreen(cam, d.a.x, d.a.y);
    const b = toScreen(cam, d.b.x, d.b.y);
    ctx.lineCap = 'round';
    ctx.strokeStyle = d.kind === 'bumper' ? '#2a2d33' : c.mid;
    ctx.lineWidth = cam.ppm * (d.kind === 'bumper' ? 0.18 : 0.22);
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  });
};
