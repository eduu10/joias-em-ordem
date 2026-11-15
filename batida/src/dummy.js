// Boneco de teste: pontos ligados por distancias fixas. Sentado, segue o carro; ejetado, vira um ragdoll livre.
import { carFrame } from './carbody.js';

export const JOINT = Object.freeze({ HEAD: 0, CHEST: 1, PELVIS: 2, KNEE: 3, FOOT: 4, ELBOW: 5, HAND: 6 });

// Pose sentada em metros: x para a frente, y para cima, a partir do quadril.
const SEATED = Object.freeze([
  [0.04, 0.72], [0.0, 0.44], [0, 0], [0.42, 0.06], [0.58, -0.32], [0.18, 0.2], [0.42, 0.28],
]);

// [a, b, rigidez]
export const LINKS = Object.freeze([
  [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [1, 5, 1], [5, 6, 1], [0, 2, 0.4], [1, 3, 0.15], [2, 4, 0.1],
].map((link) => Object.freeze(link)));

export const SEAT_HEIGHT = 0.1;

const posePoint = (frame, seatX, seatH, [lx, ly]) => {
  const along = seatX + lx;
  const up = seatH + ly;
  return { x: frame.ox + frame.ux * along + frame.nx * up, y: frame.oy + frame.uy * along + frame.ny * up };
};

export const seatedPose = (body, seatX) => {
  const frame = carFrame(body);
  return SEATED.map((local) => posePoint(frame, seatX, SEAT_HEIGHT, local));
};

const restLengths = () => LINKS.map(([a, b]) => Math.hypot(SEATED[b][0] - SEATED[a][0], SEATED[b][1] - SEATED[a][1]));

export const buildDummy = (body, seatX, index) => ({
  index,
  seatX,
  attached: true,
  ejectX: 0,
  farthest: 0,
  rest: restLengths(),
  nodes: seatedPose(body, seatX).map((p) => ({ ...p, px: p.x, py: p.y, w: 1 / 10, r: 0.12, touch: false })),
});

// Com o boneco preso, ele acompanha o assento (copia nova, com a velocidade herdada do movimento).
export const followSeat = (dummy, body) => {
  const pose = seatedPose(body, dummy.seatX);
  return { ...dummy, nodes: dummy.nodes.map((n, i) => ({ ...n, px: n.x, py: n.y, x: pose[i].x, y: pose[i].y })) };
};

// Solta o boneco com a velocidade de antes da batida (vx, vy em metros por subpasso).
export const ejectDummy = (dummy, vx, vy) => ({
  ...dummy,
  attached: false,
  ejectX: dummy.nodes[JOINT.PELVIS].x,
  nodes: dummy.nodes.map((n) => ({ ...n, px: n.x - vx, py: n.y - vy })),
});
