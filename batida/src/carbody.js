// Monta o corpo macio de um carro: 3 fileiras x 8 colunas de pontos + 2 rodas, ligados por molas.
// Fileira 0 = chassi, 1 = cintura, 2 = teto. Tudo puro: devolve objetos novos.
export const COLS = 8;
export const ROWS = 3;
export const nodeIndex = (row, col) => row * COLS + col;

const WHEEL_MASS_SHARE = 0.04;

const spring = (nodes, a, b, k, group, cols) => {
  const rest = Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y);
  return { a, b, rest, rest0: rest, k, group, c0: Math.min(...cols), c1: Math.max(...cols), broken: false };
};

const rowHeight = (def, row, col) => {
  if (row === 0) return def.clear;
  if (row === 1) return def.belt[col];
  // O teto fica sempre um pouco acima da cintura para a malha nao degenerar.
  return Math.max(def.roof[col], def.belt[col] + 0.18);
};

const buildNodes = (def, xRear, dir, spacing) => {
  const wheelMass = def.mass * WHEEL_MASS_SHARE;
  const bodyMass = (def.mass - 2 * wheelMass) / (ROWS * COLS);
  const contact = Math.max(0.3, spacing * 0.56);
  const nodes = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const x = xRear + dir * col * spacing;
      const y = -rowHeight(def, row, col);
      nodes.push({ x, y, px: x, py: y, w: 1 / bodyMass, r: 0.1, cr: contact, kind: 'body', touch: false });
    }
  }
  def.wheels.forEach((col) => {
    const x = xRear + dir * col * spacing;
    const y = -def.wheelR;
    nodes.push({ x, y, px: x, py: y, w: 1 / wheelMass, r: def.wheelR, cr: def.wheelR, kind: 'wheel', touch: false });
  });
  return nodes;
};

const buildSprings = (def, nodes) => {
  const k = def.stiff;
  const list = [];
  const add = (r0, c0, r1, c1, kk = k) => list.push(spring(nodes, nodeIndex(r0, c0), nodeIndex(r1, c1), kk, 'body', [c0, c1]));
  for (let col = 0; col < COLS; col += 1) {
    add(0, col, 1, col);
    add(1, col, 2, col);
    if (col + 1 < COLS) {
      for (let row = 0; row < ROWS; row += 1) add(row, col, row, col + 1);
      for (let row = 0; row < ROWS - 1; row += 1) {
        add(row, col, row + 1, col + 1);
        add(row + 1, col, row, col + 1);
      }
    }
    if (col + 2 < COLS) {
      add(0, col, 0, col + 2, k * 0.6);
      add(2, col, 2, col + 2, k * 0.4);
    }
  }
  def.wheels.forEach((col, i) => {
    const wheel = ROWS * COLS + i;
    const anchors = [nodeIndex(0, Math.max(0, col - 1)), nodeIndex(0, Math.min(COLS - 1, col + 1)), nodeIndex(1, col)];
    anchors.forEach((a) => list.push({ ...spring(nodes, a, wheel, 0.5, 'wheel', [col - 1, col + 1]), wheel: i }));
  });
  return list;
};

// Pecas que podem se soltar. a/b = pontos onde a peca fica presa; c0..c1 = regiao que, amassada, a solta.
const buildParts = (def, nodeCount) => {
  const [cabA, cabB] = def.cabin;
  const front = COLS - 1;
  return [
    { id: 'bumperF', kind: 'bumper', a: nodeIndex(0, front), b: nodeIndex(1, front), c0: front - 1, c1: front, on: true },
    { id: 'bumperR', kind: 'bumper', a: nodeIndex(0, 0), b: nodeIndex(1, 0), c0: 0, c1: 1, on: true },
    { id: 'hood', kind: 'hood', a: nodeIndex(1, Math.min(cabB, front - 1)), b: nodeIndex(1, front), c0: Math.min(cabB, front - 2), c1: front, on: true },
    { id: 'door', kind: 'door', a: nodeIndex(1, Math.max(1, cabA)), b: nodeIndex(1, Math.min(front - 1, Math.max(cabA + 1, cabB - 1))), c0: Math.max(1, cabA), c1: Math.min(front - 1, Math.max(cabA + 1, cabB - 1)), on: true },
    { id: 'wheelR', kind: 'wheel', wheel: 0, node: nodeCount - 2, c0: def.wheels[0] - 1, c1: def.wheels[0] + 1, on: true },
    { id: 'wheelF', kind: 'wheel', wheel: 1, node: nodeCount - 1, c0: def.wheels[1] - 1, c1: def.wheels[1] + 1, on: true },
  ];
};

/**
 * @param {object} def definicao do carro (cars.js)
 * @param {number} xFront posicao x da frente
 * @param {number} dir 1 = olha para a direita, -1 = para a esquerda
 */
export const buildCar = (def, xFront, dir = 1) => {
  const spacing = def.len / (COLS - 1);
  const xRear = xFront - dir * def.len;
  const nodes = buildNodes(def, xRear, dir, spacing);
  return {
    id: def.id,
    dir,
    spacing,
    nodes,
    springs: buildSprings(def, nodes),
    parts: buildParts(def, nodes.length),
    glass: true,
  };
};

// Media da deformacao permanente das molas da carroceria dentro das colunas c0..c1.
export const regionStrain = (body, c0, c1) => {
  let sum = 0;
  let count = 0;
  body.springs.forEach((s) => {
    if (s.group !== 'body' || s.c0 < c0 || s.c1 > c1) return;
    sum += Math.abs(s.rest - s.rest0) / s.rest0;
    count += 1;
  });
  return count ? sum / count : 0;
};

// Soma da deformacao permanente de toda a carroceria (base da pontuacao de dano).
export const totalStrain = (body) => body.springs.reduce(
  (sum, s) => (s.group === 'body' ? sum + Math.abs(s.rest - s.rest0) / s.rest0 : sum), 0,
);

// Referencial do carro: origem no chassi traseiro, u aponta para a frente, n aponta para cima.
export const carFrame = (body) => {
  const rear = body.nodes[nodeIndex(0, 0)];
  const front = body.nodes[nodeIndex(0, COLS - 1)];
  const dx = front.x - rear.x;
  const dy = front.y - rear.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const flip = body.dir === 1 ? 1 : -1;
  return { ox: rear.x, oy: rear.y, ux, uy, nx: uy * flip, ny: -ux * flip, angle: Math.atan2(dy, dx) };
};

export const centerOf = (body) => {
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  const count = ROWS * COLS;
  for (let i = 0; i < count; i += 1) {
    const n = body.nodes[i];
    x += n.x;
    y += n.y;
    vx += n.x - n.px;
    vy += n.y - n.py;
  }
  return { x: x / count, y: y / count, vx: vx / count, vy: vy / count };
};
