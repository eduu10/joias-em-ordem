// Gerador da pista. Funcoes puras: recebem um gerador com semente e devolvem obstaculos e itens.
// Regra de ouro: toda fileira deixa pelo menos uma faixa que da para passar (livre, pulando ou deslizando).
import { CONFIG, ITEM, KIND, LANES } from './config.js';
import { difficultyAt, gapAt, speedAt } from './speed.js';

const LANE_LIST = Object.freeze([0, 1, 2]);
const COINS_PER_LINE = 5;
const ARC_SPAN = 0.8;
const TAU = Math.PI * 2;

const pickInt = (rng, count) => Math.min(count - 1, Math.floor(rng() * count));
const pick = (rng, list) => list[pickInt(rng, list.length)];
const softKind = (rng) => (rng() < 0.5 ? KIND.LOW : KIND.HIGH);
const anyKind = (rng) => {
  const roll = rng();
  if (roll < 0.4) return KIND.BLOCK;
  return roll < 0.7 ? KIND.LOW : KIND.HIGH;
};

// Posicao lateral do drone: vai e volta entre as faixas `a` e `b`, parando um instante nas pontas.
export const droneLane = (a, b, t) => a + (b - a) * (0.5 - 0.5 * Math.cos((t / CONFIG.dronePeriod) * TAU));

const emptyRow = () => ({ cells: [null, null, null], drone: null, coins: -1, power: null });

// Faixas por onde da para passar numa fileira.
const passable = (row) => LANE_LIST.filter((lane) =>
  row.cells[lane] !== KIND.BLOCK && !(row.drone && lane >= row.drone[0] && lane <= row.drone[1]));

const withCoins = (rng, row, chance) =>
  (rng() < chance ? { ...row, coins: pick(rng, passable(row)) } : row);

const singleRows = (rng, d, easy) => {
  const count = !easy && rng() < 0.3 + d * 0.45 ? 2 : 1;
  const skip = pickInt(rng, LANES);
  const only = pickInt(rng, LANES);
  const cells = LANE_LIST.map((lane) => {
    const used = count === 2 ? lane !== skip : lane === only;
    return used ? anyKind(rng) : null;
  });
  return [withCoins(rng, { ...emptyRow(), cells }, 0.6)];
};

const wallRows = (rng) => {
  const drawn = LANE_LIST.map(() => anyKind(rng));
  const rescue = pickInt(rng, LANES);
  const soft = softKind(rng);
  const allBlocks = drawn.every((kind) => kind === KIND.BLOCK);
  const cells = drawn.map((kind, lane) => (allBlocks && lane === rescue ? soft : kind));
  return [withCoins(rng, { ...emptyRow(), cells }, 0.75)];
};

const droneRows = (rng) => {
  const left = rng() < 0.5;
  const row = { ...emptyRow(), drone: left ? [0, 1] : [1, 2], phase: rng() };
  return [{ ...row, coins: left ? 2 : 0 }];
};

// Tres fileiras de blocos com a passagem mudando uma faixa de cada vez.
const slalomRows = (rng) => {
  const start = rng() < 0.5 ? 0 : 2;
  return [start, 1, 2 - start].map((free) => ({
    ...emptyRow(),
    cells: LANE_LIST.map((lane) => (lane === free ? null : KIND.BLOCK)),
    coins: free,
  }));
};

// Pular e logo depois deslizar (ou o contrario), em todas as faixas.
const comboRows = (rng) => {
  const first = softKind(rng);
  const second = first === KIND.LOW ? KIND.HIGH : KIND.LOW;
  const lane = pickInt(rng, LANES);
  return [first, second].map((kind) => ({ ...emptyRow(), cells: LANE_LIST.map(() => kind), coins: lane }));
};

const breatherRows = (rng, power) => {
  const powerLane = pickInt(rng, LANES);
  const coinLane = (powerLane + 1 + pickInt(rng, LANES - 1)) % LANES;
  return [{ ...emptyRow(), coins: coinLane, power: power ? { type: power, lane: powerLane } : null }];
};

const chooseRows = (rng, d, serial) => {
  if (serial < CONFIG.easySegments) return singleRows(rng, d, true);
  const options = [
    [4, () => singleRows(rng, d, false)],
    [1 + d * 3, () => wallRows(rng)],
    [1 + d * 2, () => droneRows(rng)],
    [0.6 + d * 1.5, () => slalomRows(rng)],
    [d > 0.15 ? 0.5 + d * 1.5 : 0, () => comboRows(rng)],
    [0.8, () => breatherRows(rng, null)],
  ];
  const total = options.reduce((sum, [weight]) => sum + weight, 0);
  let roll = rng() * total;
  const chosen = options.find(([weight]) => { roll -= weight; return roll < 0; }) ?? options[0];
  return chosen[1]();
};

const rowObstacles = (row, z) => {
  const fixed = LANE_LIST
    .filter((lane) => row.cells[lane])
    .map((lane) => ({ kind: row.cells[lane], lane, z }));
  if (!row.drone) return fixed;
  const [a, b] = row.drone;
  const t = row.phase * CONFIG.dronePeriod;
  return [...fixed, { kind: KIND.DRONE, lane: droneLane(a, b, t), z, a, b, t }];
};

// Moedas no chao em linha reta; por cima de uma barreira baixa elas seguem o arco do pulo.
const rowCoins = (row, z) => {
  if (row.coins < 0) return [];
  const cell = row.cells[row.coins];
  const jumpMeters = speedAt(z) * CONFIG.jumpSeconds;
  return Array.from({ length: COINS_PER_LINE }, (_, index) => {
    const u = index / (COINS_PER_LINE - 1) - 0.5;
    if (cell === KIND.LOW) {
      const lift = CONFIG.jumpHeight * (1 - (2 * u * ARC_SPAN) ** 2);
      return { type: ITEM.COIN, lane: row.coins, z: z + u * ARC_SPAN * jumpMeters, h: CONFIG.coinHeight + lift };
    }
    const h = cell === KIND.HIGH ? CONFIG.slideCenter + 0.1 : CONFIG.coinHeight;
    return { type: ITEM.COIN, lane: row.coins, z: z + u * (COINS_PER_LINE - 1) * CONFIG.coinSpacing, h };
  });
};

const rowPower = (row, z) =>
  (row.power ? [{ type: row.power.type, lane: row.power.lane, z, h: CONFIG.coinHeight + 0.15 }] : []);

/**
 * Gera o proximo trecho da pista.
 * @param {() => number} rng gerador com semente (0 <= valor < 1)
 * @param {{z: number, serial: number, lastPowerZ: number}} cursor onde o trecho comeca
 * @returns {{obstacles: object[], items: object[], nextZ: number, lastPowerZ: number}}
 */
export const generateSegment = (rng, cursor) => {
  const { z, serial, lastPowerZ } = cursor;
  const d = difficultyAt(z);
  const gap = gapAt(z);
  const powerDue = serial >= CONFIG.easySegments && z - lastPowerZ >= CONFIG.powerEveryMeters;
  const powerHit = powerDue && rng() < CONFIG.powerChance;
  const power = powerHit ? (rng() < 0.5 ? ITEM.MAGNET : ITEM.SHIELD) : null;
  const rows = power ? breatherRows(rng, power) : chooseRows(rng, d, serial);
  const placed = rows.map((row, index) => ({ row, z: z + index * gap }));
  return {
    obstacles: placed.flatMap((entry) => rowObstacles(entry.row, entry.z)),
    items: placed.flatMap((entry) => [...rowCoins(entry.row, entry.z), ...rowPower(entry.row, entry.z)]),
    nextZ: z + rows.length * gap,
    lastPowerZ: powerDue ? (powerHit ? z : z - CONFIG.powerEveryMeters / 2) : lastPowerZ,
  };
};
