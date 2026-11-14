// Gerador de numeros com semente (mulberry32). A logica do quiz recebe um destes em vez de usar Math.random,
// assim a mesma semente sempre gera a mesma partida.
const UINT32 = 4294967296;

export const createRng = (seed) => {
  let a = (Number(seed) || 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
};

// Embaralha sem alterar a lista recebida.
export const shuffled = (items, rng) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
