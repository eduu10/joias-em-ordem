// Busca em profundidade que acha uma solucao. Usada para garantir fases resolviveis e para dar dicas.
import { applyMove, canMove, isJarDone, isSolved, isUniform } from './puzzle.js';

// Potes na mesma configuracao em outra ordem sao o mesmo estado.
const keyOf = (jars) => jars.map((jar) => jar.join(',')).sort().join('|');

const candidateMoves = (jars, capacity) => {
  const firstEmpty = jars.findIndex((jar) => jar.length === 0);
  const moves = [];
  jars.forEach((source, from) => {
    if (source.length === 0 || isJarDone(source, capacity)) return;
    jars.forEach((target, to) => {
      if (!canMove(jars, from, to, capacity)) return;
      const toEmpty = target.length === 0;
      // Mover um pote de cor unica para um vazio nao muda nada, e basta testar um vazio.
      if (toEmpty && (to !== firstEmpty || isUniform(source))) return;
      moves.push({ from, to, toEmpty });
    });
  });
  return moves.sort((a, b) => Number(a.toEmpty) - Number(b.toEmpty));
};

/**
 * @param {number[][]} jars
 * @param {number} capacity
 * @param {number} nodeLimit
 * @returns {{from: number, to: number}[] | null} lista de jogadas, ou null se nao achou dentro do limite
 */
export const solve = (jars, capacity, nodeLimit) => {
  const seen = new Set([keyOf(jars)]);
  const stack = [{ jars, moves: candidateMoves(jars, capacity), next: 0, via: null }];
  let nodes = 0;
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (isSolved(frame.jars, capacity)) {
      return stack.slice(1).map(({ via }) => ({ from: via.from, to: via.to }));
    }
    if (frame.next >= frame.moves.length) {
      stack.pop();
      continue;
    }
    const move = frame.moves[frame.next];
    frame.next += 1;
    const nextJars = applyMove(frame.jars, move.from, move.to);
    const key = keyOf(nextJars);
    if (seen.has(key)) continue;
    seen.add(key);
    nodes += 1;
    if (nodes > nodeLimit) return null;
    stack.push({ jars: nextJars, moves: candidateMoves(nextJars, capacity), next: 0, via: move });
  }
  return null;
};
