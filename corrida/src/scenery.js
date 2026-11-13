// Cenario em perspectiva ao redor da pista: o mar de nuvens la embaixo e as ilhas flutuantes dos lados.
// As posicoes saem da distancia percorrida, entao o cenario "anda" sem guardar estado.
import { CAMERA, project } from './camera.js';
import { mix, noise, rgb } from './world.js';

const TAU = Math.PI * 2;
const PUFF_COUNT = 30;
const PUFF_SPAN = 190;
const PUFF_DEPTH = -11;
const PUFF_PARALLAX = 0.55;
const ISLAND_COUNT = 7;
const ISLAND_SPAN = 280;
const FADE_METERS = 45;

const wrap = (value, span) => ((value % span) + span) % span;

const PUFFS = Object.freeze(Array.from({ length: PUFF_COUNT }, (_, i) => Object.freeze({
  x: (noise(i, 21) - 0.5) * 170,
  z: noise(i, 22) * PUFF_SPAN,
  radius: 8 + noise(i, 23) * 9,
})));

const ISLANDS = Object.freeze(Array.from({ length: ISLAND_COUNT }, (_, i) => Object.freeze({
  x: (i % 2 === 0 ? -1 : 1) * (5 + noise(i, 31) * 9),
  y: -3.5 + noise(i, 32) * 5.5,
  z: (i / ISLAND_COUNT) * ISLAND_SPAN + noise(i, 33) * 18,
  size: 1.6 + noise(i, 34) * 1.8,
  trees: 1 + Math.floor(noise(i, 35) * 3),
  beacon: noise(i, 36) > 0.55,
})));

const farFade = (z, span) => Math.min(1, (span - z) / FADE_METERS);

export const drawCloudSea = (ctx, palette, view) => {
  const light = rgb(mix(palette.sea, [255, 255, 255], 0.35));
  const dark = rgb(mix(palette.sea, palette.shade, 0.55));
  PUFFS
    .map((puff) => ({ puff, z: wrap(puff.z - view.distance * PUFF_PARALLAX, PUFF_SPAN) }))
    .sort((a, b) => b.z - a.z)
    .forEach(({ puff, z }) => {
      const point = project(puff.x, PUFF_DEPTH, z, view.camX);
      const rx = puff.radius * point.scale;
      if (point.y - rx * 0.4 > view.bottom) return;
      ctx.globalAlpha = 0.85 * farFade(z, PUFF_SPAN);
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + rx * 0.08, rx, rx * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.ellipse(point.x - rx * 0.28, point.y - rx * 0.05, rx * 0.55, rx * 0.2, 0, 0, TAU);
      ctx.ellipse(point.x + rx * 0.3, point.y, rx * 0.5, rx * 0.17, 0, 0, TAU);
      ctx.ellipse(point.x, point.y - rx * 0.1, rx * 0.45, rx * 0.2, 0, 0, TAU);
      ctx.fill();
    });
  ctx.globalAlpha = 1;
};

const drawTree = (ctx, x, y, size, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.42, y);
  ctx.lineTo(x, y - size * 1.5);
  ctx.lineTo(x + size * 0.42, y);
  ctx.closePath();
  ctx.fill();
};

const drawIsland = (ctx, island, point, palette, time) => {
  const rx = island.size * point.scale;
  const ry = rx * 0.24;
  const { x, y } = point;
  const rock = ctx.createLinearGradient(0, y, 0, y + rx * 1.3);
  rock.addColorStop(0, rgb(mix([126, 86, 150], palette.mid, 0.35)));
  rock.addColorStop(1, rgb(mix([46, 30, 86], palette.top, 0.4)));
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.moveTo(x - rx, y);
  ctx.lineTo(x - rx * 0.62, y + rx * 0.5);
  ctx.lineTo(x - rx * 0.3, y + rx * 0.72);
  ctx.lineTo(x - rx * 0.08, y + rx * 1.3);
  ctx.lineTo(x + rx * 0.24, y + rx * 0.8);
  ctx.lineTo(x + rx * 0.58, y + rx * 0.58);
  ctx.lineTo(x + rx, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgb(mix([70, 190, 150], palette.mid, 0.3));
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgb(mix([150, 236, 170], palette.horizon, 0.3));
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.1, y - ry * 0.25, rx * 0.72, ry * 0.6, 0, 0, TAU);
  ctx.fill();

  const leaf = rgb(mix([36, 120, 110], palette.top, 0.3));
  for (let i = 0; i < island.trees; i += 1) {
    drawTree(ctx, x + (i - (island.trees - 1) / 2) * rx * 0.42, y - ry * 0.1, rx * 0.3, leaf);
  }
  if (island.beacon) {
    const glow = 0.6 + 0.4 * Math.sin(time * 3 + island.x);
    ctx.fillStyle = `rgba(255, 236, 150, ${glow})`;
    ctx.beginPath();
    ctx.arc(x + rx * 0.5, y - ry * 0.9, Math.max(1.2, rx * 0.07), 0, TAU);
    ctx.fill();
  }
};

export const drawIslands = (ctx, palette, view) => {
  ISLANDS
    .map((island) => ({ island, z: wrap(island.z - view.distance, ISLAND_SPAN) - 8 }))
    .sort((a, b) => b.z - a.z)
    .forEach(({ island, z }) => {
      if (z + CAMERA.back < 3) return;
      const bob = Math.sin(view.time * 0.7 + island.z) * 0.25;
      const point = project(island.x, island.y + bob, z, view.camX);
      ctx.globalAlpha = Math.max(0, Math.min(farFade(z + 8, ISLAND_SPAN), (z + CAMERA.back - 3) / 6));
      drawIsland(ctx, island, point, palette, view.time);
    });
  ctx.globalAlpha = 1;
};
