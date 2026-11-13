// Regras do quebra-cabeca. Um pote e uma lista de cores, do fundo para o topo.
// Funcoes puras: nunca alteram os potes recebidos.
export const topOf = (jar) => jar[jar.length - 1];

export const isUniform = (jar) => jar.every((color) => color === jar[0]);

export const isJarDone = (jar, capacity) => jar.length === capacity && isUniform(jar);

export const isSolved = (jars, capacity) =>
  jars.every((jar) => jar.length === 0 || isJarDone(jar, capacity));

export const canMove = (jars, from, to, capacity) => {
  const source = jars[from];
  const target = jars[to];
  if (from === to || !source || !target || source.length === 0) return false;
  if (target.length >= capacity) return false;
  return target.length === 0 || topOf(target) === topOf(source);
};

export const applyMove = (jars, from, to) => {
  const color = topOf(jars[from]);
  return jars.map((jar, index) => {
    if (index === from) return jar.slice(0, -1);
    if (index === to) return [...jar, color];
    return jar;
  });
};

export const hasMoves = (jars, capacity) =>
  jars.some((_, from) => jars.some((__, to) => canMove(jars, from, to, capacity)));
