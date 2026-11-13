// Gerador de numeros pseudoaleatorios com semente (mulberry32).
// A simulacao guarda a semente no estado, entao a mesma semente gera sempre a mesma pista.
const STEP = 0x6d2b79f5;

export const createRng = (seed) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + STEP) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Devolve a semente atual, para continuar a sequencia mais tarde.
  next.seed = () => a;
  return next;
};
