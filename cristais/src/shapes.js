// Pecas do jogo. Cada familia tem a sua cor de cristal [matiz, saturacao, luz] e um peso no sorteio.
// `turns` diz quantas rotacoes de 90 graus sao diferentes entre si.
const FAMILIES = Object.freeze([
  { name: 'dot', color: [48, 92, 58], weight: 2, turns: 1, cells: [[0, 0]] },
  { name: 'duo', color: [158, 72, 46], weight: 4, turns: 2, cells: [[0, 0], [1, 0]] },
  { name: 'i3', color: [196, 88, 52], weight: 6, turns: 2, cells: [[0, 0], [1, 0], [2, 0]] },
  { name: 'i4', color: [222, 86, 60], weight: 5, turns: 2, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { name: 'i5', color: [262, 82, 64], weight: 4, turns: 2, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { name: 'o2', color: [32, 94, 56], weight: 6, turns: 1, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { name: 'o3', color: [350, 84, 58], weight: 3, turns: 1, cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
  { name: 'corner', color: [84, 74, 48], weight: 6, turns: 4, cells: [[0, 0], [0, 1], [1, 1]] },
  { name: 'l', color: [14, 90, 58], weight: 5, turns: 4, cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { name: 'j', color: [176, 80, 44], weight: 5, turns: 4, cells: [[1, 0], [1, 1], [1, 2], [0, 2]] },
  { name: 't', color: [292, 76, 60], weight: 5, turns: 4, cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: 's', color: [128, 66, 48], weight: 3, turns: 2, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { name: 'z', color: [326, 84, 62], weight: 3, turns: 2, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { name: 'bigCorner', color: [240, 78, 68], weight: 4, turns: 4, cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
]);

// Leva a peca para encostar no canto (0, 0) e ordena as casas.
const normalize = (cells) => {
  const minCol = Math.min(...cells.map(([col]) => col));
  const minRow = Math.min(...cells.map(([, row]) => row));
  return cells
    .map(([col, row]) => [col - minCol, row - minRow])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};

const rotate = (cells, turns) =>
  (turns === 0 ? normalize(cells) : rotate(cells.map(([col, row]) => [-row, col]), turns - 1));

const freezeCells = (cells) => Object.freeze(cells.map((cell) => Object.freeze(cell)));

// Cor do cristal pelo numero guardado no tabuleiro (1 em diante; 0 e casa vazia).
export const PALETTE = Object.freeze(FAMILIES.map((family) => Object.freeze(family.color)));
export const gemColor = (colorId) => PALETTE[(colorId - 1) % PALETTE.length];

export const SHAPES = Object.freeze(
  FAMILIES.flatMap((family, familyIndex) =>
    Array.from({ length: family.turns }, (_, turn) => {
      const cells = rotate(family.cells, turn);
      return {
        family: family.name,
        color: familyIndex + 1,
        weight: family.weight / family.turns,
        w: Math.max(...cells.map(([col]) => col)) + 1,
        h: Math.max(...cells.map(([, row]) => row)) + 1,
        cells: freezeCells(cells),
      };
    })).map((shape, id) => Object.freeze({ id, ...shape })),
);
