// Ceu: gradiente que muda de cor com a distancia, estrelas, sol (ou lua) e a faixa de nuvens no horizonte.
// Tudo e funcao da distancia e do tempo; nada aqui guarda estado.
import { CAMERA } from './camera.js';

const TAU = Math.PI * 2;
const CYCLE_METERS = 1300;
const STAR_COUNT = 70;

// Cores em [r, g, b]. A corrida comeca no por do sol e passa por anoitecer, noite e amanhecer.
const PALETTES = Object.freeze([
  { top: [44, 24, 96], mid: [186, 66, 130], horizon: [255, 164, 96], sun: [255, 232, 160], sea: [255, 204, 178], shade: [192, 104, 150], road: [70, 52, 120], stars: 0.12, sunLift: 34 },
  { top: [24, 18, 72], mid: [104, 54, 148], horizon: [244, 124, 146], sun: [255, 196, 176], sea: [222, 166, 206], shade: [118, 78, 160], road: [56, 44, 112], stars: 0.55, sunLift: 12 },
  { top: [8, 12, 44], mid: [26, 44, 104], horizon: [70, 124, 184], sun: [232, 242, 255], sea: [140, 172, 222], shade: [52, 74, 138], road: [34, 44, 96], stars: 1, sunLift: 96 },
  { top: [48, 92, 170], mid: [132, 170, 228], horizon: [255, 206, 156], sun: [255, 246, 206], sea: [255, 236, 226], shade: [198, 164, 200], road: [72, 80, 140], stars: 0, sunLift: 52 },
].map((palette) => Object.freeze(palette)));

export const noise = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export const rgb = (color, alpha = 1) => `rgb(${color[0] | 0} ${color[1] | 0} ${color[2] | 0} / ${alpha})`;
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const blend = (a, b, t) => a + (b - a) * t;

// Paleta do momento: mistura suave entre duas fases do dia.
export const skyPalette = (distance) => {
  const phase = (Math.max(0, distance) / CYCLE_METERS) % PALETTES.length;
  const index = Math.floor(phase);
  const from = PALETTES[index];
  const to = PALETTES[(index + 1) % PALETTES.length];
  const linear = phase - index;
  const t = linear * linear * (3 - 2 * linear);
  return {
    top: mix(from.top, to.top, t),
    mid: mix(from.mid, to.mid, t),
    horizon: mix(from.horizon, to.horizon, t),
    sun: mix(from.sun, to.sun, t),
    sea: mix(from.sea, to.sea, t),
    shade: mix(from.shade, to.shade, t),
    road: mix(from.road, to.road, t),
    stars: blend(from.stars, to.stars, t),
    sunLift: blend(from.sunLift, to.sunLift, t),
  };
};

const drawGradient = (ctx, bounds, palette) => {
  const horizon = CAMERA.horizonY;
  const sky = ctx.createLinearGradient(0, bounds.y, 0, horizon);
  sky.addColorStop(0, rgb(palette.top));
  sky.addColorStop(0.62, rgb(palette.mid));
  sky.addColorStop(1, rgb(palette.horizon));
  ctx.fillStyle = sky;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, horizon - bounds.y + 1);

  const below = ctx.createLinearGradient(0, horizon, 0, bounds.y + bounds.h);
  below.addColorStop(0, rgb(mix(palette.horizon, palette.sea, 0.55)));
  below.addColorStop(0.35, rgb(palette.shade));
  below.addColorStop(1, rgb(mix(palette.shade, palette.top, 0.6)));
  ctx.fillStyle = below;
  ctx.fillRect(bounds.x, horizon, bounds.w, bounds.y + bounds.h - horizon);
};

const drawStars = (ctx, bounds, palette, time) => {
  if (palette.stars <= 0.02) return;
  const height = CAMERA.horizonY - 30 - bounds.y;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * (1 + noise(i, 3) * 2.5) + i);
    ctx.globalAlpha = palette.stars * twinkle * (0.4 + noise(i, 4) * 0.6);
    const size = 0.6 + noise(i, 5) * 1.1;
    ctx.fillRect(bounds.x + noise(i, 1) * bounds.w, bounds.y + noise(i, 2) * height, size, size);
  }
  ctx.globalAlpha = 1;
};

const drawSun = (ctx, palette, camX) => {
  const x = CAMERA.centerX - camX * 4;
  const y = CAMERA.horizonY - palette.sunLift;
  const halo = ctx.createRadialGradient(x, y, 8, x, y, 170);
  halo.addColorStop(0, rgb(palette.sun, 0.75));
  halo.addColorStop(0.3, rgb(palette.sun, 0.22));
  halo.addColorStop(1, rgb(palette.sun, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - 170, y - 170, 340, 340);
  const disc = ctx.createLinearGradient(0, y - 44, 0, y + 44);
  disc.addColorStop(0, rgb(mix(palette.sun, [255, 255, 255], 0.6)));
  disc.addColorStop(1, rgb(mix(palette.sun, palette.horizon, 0.45)));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, 44, 0, TAU);
  ctx.fill();
};

// Uma cordilheira de nuvens: varias bolhas ao longo de uma linha, correndo devagar para o lado.
const drawCloudBank = (ctx, bounds, layer) => {
  const { y, radius, spacing, drift, color } = layer;
  const count = Math.ceil(bounds.w / spacing) + 3;
  const shift = ((drift % spacing) + spacing) % spacing;
  const first = Math.floor(drift / spacing);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = -1; i < count; i += 1) {
    const seed = i - first;
    const r = radius * (0.65 + noise(seed, layer.salt) * 0.7);
    const x = bounds.x + i * spacing + shift;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y + r * 0.35, r, 0, TAU);
  }
  ctx.rect(bounds.x, y + radius * 0.4, bounds.w, radius * 2.2);
  ctx.fill();
};

/**
 * Desenha o fundo inteiro ate a linha do horizonte.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number, w: number, h: number}} bounds area visivel no espaco do jogo
 * @param {object} palette resultado de skyPalette
 * @param {{time: number, distance: number, camX: number}} view
 */
export const drawSky = (ctx, bounds, palette, view) => {
  drawGradient(ctx, bounds, palette);
  drawStars(ctx, bounds, palette, view.time);
  drawSun(ctx, palette, view.camX);
  const horizon = CAMERA.horizonY;
  const slide = view.distance * 0.02 + view.time * 1.5;
  drawCloudBank(ctx, bounds, {
    y: horizon - 13, radius: 17, spacing: 30, drift: slide - view.camX * 3, salt: 7,
    color: rgb(mix(palette.horizon, palette.mid, 0.45), 0.75),
  });
  drawCloudBank(ctx, bounds, {
    y: horizon - 4, radius: 13, spacing: 23, drift: slide * 2 - view.camX * 6, salt: 9,
    color: rgb(mix(palette.sea, palette.horizon, 0.35), 0.95),
  });
};
