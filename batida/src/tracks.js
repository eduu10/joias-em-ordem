// Pistas de teste. Obstaculos estaticos sao poligonos convexos (sentido horario na tela, y para baixo).
// O obstaculo principal fica perto de x = 0 e o carro chega pela esquerda.
const box = (x0, y0, x1, y1, kind) => Object.freeze({
  kind, points: Object.freeze([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]),
});
const poly = (points, kind) => Object.freeze({ kind, points: Object.freeze(points) });

// Pilha em piramide de barris: base com `base` barris de raio r.
const barrelStack = (x0, base, r) => {
  const list = [];
  for (let row = 0; row < base; row += 1) {
    for (let i = 0; i < base - row; i += 1) {
      list.push(Object.freeze({ kind: 'barrel', x: x0 + r + i * 2 * r + row * r, y: -r - row * r * 1.74, r }));
    }
  }
  return Object.freeze(list);
};

const coneField = () => Object.freeze(Array.from({ length: 12 }, (_, i) => Object.freeze({
  kind: 'cone', x: 2 + i * 2.4, y: -0.26, r: 0.26,
})));

const NONE = Object.freeze([]);

export const TRACKS = Object.freeze([
  Object.freeze({ id: 'wall', price: 0, statics: Object.freeze([box(0, -3.2, 1.2, 0, 'concrete')]), props: NONE, driveEnd: -6 }),
  Object.freeze({ id: 'post', price: 300, statics: Object.freeze([box(0, -0.75, 0.45, 0, 'steel')]), props: NONE, driveEnd: -6 }),
  Object.freeze({
    id: 'cones', price: 700, statics: Object.freeze([box(32, -3.4, 34, 0, 'concrete')]), props: coneField(), driveEnd: -4,
  }),
  Object.freeze({
    id: 'ramp', price: 1200,
    statics: Object.freeze([poly([[-12, 0], [0, -2.4], [0, 0]], 'ramp'), box(16, -7, 17.5, 0, 'concrete')]),
    props: barrelStack(9.5, 5, 0.45), driveEnd: -13,
  }),
  Object.freeze({
    id: 'headon', price: 2200, statics: NONE, props: NONE, driveEnd: -3,
    target: Object.freeze({ front: 14, speed: 14 }),
  }),
  Object.freeze({
    id: 'cliff', price: 3600, groundTop: -18, driveEnd: -4,
    statics: Object.freeze([box(-170, -18, 0, 0, 'cliff'), box(52, -9, 55, 0, 'concrete')]), props: NONE,
  }),
]);

export const trackById = (id) => TRACKS.find((entry) => entry.id === id) ?? null;
