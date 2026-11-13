// Geometria do caminho: converte "distancia percorrida" em posicao no mapa.
import { PATH } from './config.js';

const SEGMENTS = Object.freeze(PATH.slice(1).map(([x, y], index) => {
  const [fromX, fromY] = PATH[index];
  return Object.freeze({ fromX, fromY, dx: x - fromX, dy: y - fromY, length: Math.hypot(x - fromX, y - fromY) });
}));

export const PATH_LENGTH = SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);

export const pathPoint = (distance) => {
  let left = Math.max(0, distance);
  for (const segment of SEGMENTS) {
    if (left <= segment.length) {
      const t = segment.length === 0 ? 0 : left / segment.length;
      return { x: segment.fromX + segment.dx * t, y: segment.fromY + segment.dy * t };
    }
    left -= segment.length;
  }
  const [x, y] = PATH[PATH.length - 1];
  return { x, y };
};
