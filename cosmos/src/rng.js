// Gerador de numeros aleatorios com semente (mulberry32). Puro: devolve o valor e a proxima semente.
export const nextRandom = (seed) => {
  const next = (seed + 0x6d2b79f5) >>> 0;
  const a = Math.imul(next ^ (next >>> 15), next | 1);
  const b = a ^ (a + Math.imul(a ^ (a >>> 7), a | 61));
  return { seed: next, value: ((b ^ (b >>> 14)) >>> 0) / 4294967296 };
};

// Sorteia um indice conforme os pesos dados. `value` vai de 0 (inclusive) a 1 (exclusive).
export const pickWeighted = (weights, value) => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let left = value * total;
  for (let index = 0; index < weights.length; index += 1) {
    left -= weights[index];
    if (left < 0) return index;
  }
  return weights.length - 1;
};
