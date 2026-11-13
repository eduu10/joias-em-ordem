// Gera as fases. A fase N e sempre a mesma (semente fixa) e sempre tem solucao.
import { CONFIG } from './config.js';
import { isJarDone } from './puzzle.js';
import { solve } from './solver.js';

const SEED_STEP = 7919;

// Gerador pseudoaleatorio pequeno e deterministico (mulberry32).
const createRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

export const colorsFor = (level) => {
  if (level <= 1) return 2;
  return Math.min(CONFIG.maxColors, 3 + Math.floor((level - 2) / CONFIG.levelsPerNewColor));
};

const shuffled = (items, random) =>
  items
    .map((item) => ({ item, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);

const deal = (colors, capacity, random) => {
  const gems = Array.from({ length: colors * capacity }, (_, index) => Math.floor(index / capacity));
  const mixed = shuffled(gems, random);
  const filled = Array.from({ length: colors }, (_, jar) => mixed.slice(jar * capacity, (jar + 1) * capacity));
  const empty = Array.from({ length: CONFIG.emptyJars }, () => []);
  return [...filled, ...empty];
};

/**
 * @param {number} level numero da fase, a partir de 1
 * @returns {{jars: number[][], capacity: number, solvable: boolean}}
 */
export const generateLevel = (level) => {
  const { capacity } = CONFIG;
  const colors = colorsFor(level);
  const random = createRandom(level * SEED_STEP);
  let jars = deal(colors, capacity, random);
  for (let attempt = 0; attempt < CONFIG.generationAttempts; attempt += 1) {
    const startsMixed = !jars.some((jar) => isJarDone(jar, capacity));
    if (startsMixed && solve(jars, capacity, CONFIG.solverNodeLimit)) {
      return { jars, capacity, solvable: true };
    }
    jars = deal(colors, capacity, random);
  }
  return { jars, capacity, solvable: false };
};
