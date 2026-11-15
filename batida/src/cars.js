// Carros do jogo: desenhos genericos e originais, sem marcas reais.
// Alturas em metros a partir do chao, uma por coluna (8 colunas da traseira para a frente).
// belt = linha da cintura (base dos vidros), roof = teto; cabin = [primeira, ultima] coluna com vidro.
// seats = distancia (m) da traseira ate o quadril de cada boneco.
const car = (spec) => Object.freeze({ ...spec, belt: Object.freeze(spec.belt), roof: Object.freeze(spec.roof) });

export const CARS = Object.freeze([
  car({
    id: 'hatch', price: 0, hue: 4, len: 3.9, clear: 0.42, wheelR: 0.32, wheels: [1, 6],
    belt: [0.8, 0.95, 0.98, 1.0, 1.0, 0.98, 0.9, 0.78], roof: [1.05, 1.42, 1.5, 1.5, 1.45, 1.2, 1.08, 0.95],
    cabin: [1, 5], seats: [2.4, 1.4], mass: 1100, stiff: 0.55, soft: 1.0, damageRef: 1.3,
  }),
  car({
    id: 'pickup', price: 500, hue: 205, len: 5.2, clear: 0.6, wheelR: 0.42, wheels: [1, 6],
    belt: [1.1, 1.12, 1.12, 1.15, 1.18, 1.15, 1.12, 1.0], roof: [1.3, 1.32, 1.34, 1.85, 1.88, 1.4, 1.34, 1.2],
    cabin: [3, 5], seats: [3.0, 2.3], mass: 1900, stiff: 0.7, soft: 0.8, damageRef: 1.4,
  }),
  car({
    id: 'van', price: 1400, hue: 48, len: 4.9, clear: 0.48, wheelR: 0.36, wheels: [1, 6],
    belt: [1.1, 1.12, 1.14, 1.15, 1.15, 1.12, 1.0, 0.85], roof: [2.0, 2.05, 2.05, 2.05, 2.05, 1.95, 1.45, 1.1],
    cabin: [5, 6], seats: [3.3, 1.8], mass: 2000, stiff: 0.5, soft: 1.1, damageRef: 1.6,
  }),
  car({
    id: 'sport', price: 2800, hue: 132, len: 4.4, clear: 0.36, wheelR: 0.33, wheels: [1, 6],
    belt: [0.72, 0.78, 0.8, 0.8, 0.78, 0.72, 0.62, 0.55], roof: [0.92, 1.0, 1.22, 1.25, 1.12, 0.86, 0.72, 0.66],
    cabin: [2, 5], seats: [2.5, 1.7], mass: 1300, stiff: 0.75, soft: 0.75, damageRef: 1.2,
  }),
  car({
    id: 'bus', price: 6000, hue: 28, len: 10.5, clear: 0.62, wheelR: 0.5, wheels: [1, 6],
    belt: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.35], roof: [2.9, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 2.85],
    cabin: [0, 7], seats: [9.2, 5.0], mass: 9000, stiff: 0.4, soft: 1.2, damageRef: 0.5,
  }),
  car({
    id: 'monster', price: 9500, hue: 285, len: 4.6, clear: 1.25, wheelR: 0.85, wheels: [1, 6],
    belt: [1.8, 1.82, 1.85, 1.88, 1.9, 1.85, 1.8, 1.7], roof: [2.1, 2.15, 2.6, 2.65, 2.6, 2.15, 2.05, 1.95],
    cabin: [2, 5], seats: [2.9, 2.0], mass: 4200, stiff: 0.6, soft: 0.9, damageRef: 1.1,
  }),
]);

// Carro alvo da pista "Frente a frente" (nao e jogavel).
export const TARGET_CAR = car({
  id: 'target', price: 0, hue: 0, len: 4.3, clear: 0.42, wheelR: 0.33, wheels: [1, 6],
  belt: [0.85, 0.9, 0.95, 0.98, 0.98, 0.95, 0.85, 0.75], roof: [1.0, 1.15, 1.45, 1.48, 1.42, 1.08, 1.0, 0.9],
  cabin: [2, 5], seats: [], mass: 1300, stiff: 0.55, soft: 1.0, damageRef: 1.3, gray: true,
});

export const carById = (id) => CARS.find((entry) => entry.id === id) ?? null;
