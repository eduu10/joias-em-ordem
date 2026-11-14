// Posicoes fixas (espaco 360 x 640) das areas de toque e dos elementos da tela.
const rect = (x, y, w, h) => Object.freeze({ x, y, w, h });

export const CARDS = Object.freeze([
  rect(16, 424, 158, 90), rect(186, 424, 158, 90),
  rect(16, 526, 158, 90), rect(186, 526, 158, 90),
]);

export const HOME = Object.freeze({
  run: rect(56, 448, 248, 64),
  daily: rect(56, 528, 248, 56),
});

export const OVER = Object.freeze({
  primary: rect(30, 410, 300, 58),
  secondary: rect(30, 480, 300, 52),
  home: rect(110, 548, 140, 42),
});

export const LYRIC = Object.freeze({ x: 18, y: 126, w: 324, h: 200, size: 23 });
export const TIMER = Object.freeze({ x: 180, y: 388, r: 22 });

export const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
