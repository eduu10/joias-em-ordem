// Gerador pseudoaleatorio com semente (mulberry32). Puro: devolve o valor e a nova semente.
export const nextRandom = (seed) => {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: s };
};

// Versao com estado interno, so para efeitos visuais (fora da simulacao).
export const createRandom = (seed) => {
  let current = seed >>> 0;
  return () => {
    const result = nextRandom(current);
    current = result.seed;
    return result.value;
  };
};
