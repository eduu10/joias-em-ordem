// Colisoes por posicao. Estas funcoes so alteram as copias de trabalho criadas em physics.js.

// Pre-calcula as arestas (com normal para fora) de um poligono convexo em sentido horario na tela.
export const prepareStatic = (shape) => {
  const { points } = shape;
  const edges = points.map(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    const dx = bx - ax;
    const dy = by - ay;
    const d = Math.hypot(dx, dy) || 1;
    return { ax, ay, nx: dy / d, ny: -dx / d };
  });
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    kind: shape.kind, points, edges,
    minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys),
  };
};

// Empurra o ponto para fora ao longo da normal e aplica atrito de Coulomb proporcional ao empurrao.
// Devolve a velocidade com que o ponto vinha contra a superficie (unidades por subpasso).
export const contact = (p, nx, ny, depth, mu) => {
  const vx = p.x - p.px;
  const vy = p.y - p.py;
  const approach = -(vx * nx + vy * ny);
  p.x += nx * depth;
  p.y += ny * depth;
  const vt = vx * -ny + vy * nx;
  const limit = mu * depth;
  const cut = Math.max(-limit, Math.min(limit, vt));
  p.px += -ny * cut;
  p.py += nx * cut;
  p.touch = true;
  return { approach, slide: Math.abs(vt) };
};

export const collideFloor = (p, mu) => {
  if (p.y <= -p.r) return null;
  return contact(p, 0, -1, p.y + p.r, mu);
};

export const collidePoly = (p, shape, mu) => {
  const r = p.r;
  if (p.x < shape.minX - r || p.x > shape.maxX + r || p.y < shape.minY - r || p.y > shape.maxY + r) return null;
  let best = -Infinity;
  let edge = null;
  for (const e of shape.edges) {
    const d = e.nx * (p.x - e.ax) + e.ny * (p.y - e.ay);
    if (d >= r) return null;
    if (d > best) {
      best = d;
      edge = e;
    }
  }
  return contact(p, edge.nx, edge.ny, r - best, mu);
};

// Dois circulos de grupos diferentes: separa pesando pela massa inversa.
export const collidePair = (a, ra, b, rb, mu) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const reach = ra + rb;
  const d2 = dx * dx + dy * dy;
  if (d2 >= reach * reach) return 0;
  const total = a.w + b.w;
  if (total <= 0) return 0;
  const d = Math.sqrt(d2);
  const nx = d > 1e-6 ? dx / d : 1;
  const ny = d > 1e-6 ? dy / d : 0;
  const depth = reach - d;
  const wa = a.w / total;
  const wb = b.w / total;
  const rvx = (b.x - b.px) - (a.x - a.px);
  const rvy = (b.y - b.py) - (a.y - a.py);
  const approach = -(rvx * nx + rvy * ny);
  a.x -= nx * depth * wa;
  a.y -= ny * depth * wa;
  b.x += nx * depth * wb;
  b.y += ny * depth * wb;
  const vt = rvx * -ny + rvy * nx;
  const limit = mu * depth;
  const cut = Math.max(-limit, Math.min(limit, vt));
  a.px -= -ny * cut * wa;
  a.py -= nx * cut * wa;
  b.px += -ny * cut * wb;
  b.py += nx * cut * wb;
  return approach;
};

export const solveLink = (a, b, rest, k) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const total = a.w + b.w;
  if (d < 1e-9 || total <= 0) return;
  const diff = ((d - rest) / d) * k;
  const wa = a.w / total;
  const wb = b.w / total;
  a.x += dx * diff * wa;
  a.y += dy * diff * wa;
  b.x -= dx * diff * wb;
  b.y -= dy * diff * wb;
};
