// Gerador de numeros com semente (mulberry32), sem estado escondido:
// recebe a semente e devolve o valor sorteado junto com a proxima semente.
const STEP = 0x6d2b79f5;
const RANGE = 4294967296;

export const normalizeSeed = (seed) => (Number.isFinite(seed) ? Math.floor(Math.abs(seed)) % RANGE : 1);

export const nextRandom = (seed) => {
  const next = (normalizeSeed(seed) + STEP) % RANGE;
  const a = Math.imul(next ^ (next >>> 15), next | 1);
  const b = a ^ (a + Math.imul(a ^ (a >>> 7), a | 61));
  return { seed: next, value: ((b ^ (b >>> 14)) >>> 0) / RANGE };
};

// Inteiro em [0, count).
export const nextInt = (seed, count) => {
  const roll = nextRandom(seed);
  return { seed: roll.seed, value: Math.min(count - 1, Math.floor(roll.value * count)) };
};
