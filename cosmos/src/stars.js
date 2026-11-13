// Desenho das estrelas e da galaxia (niveis 7 a 9). O brilho em volta fica numa camada que nao gira.
import { hsl } from './draw.js';
import { TAU, blob, clipDisc, disc, face, halo, noise } from './paint.js';

const EMBER = [10, 100, 58];
const AZURE = [214, 100, 68];
const VIOLET = [282, 85, 62];

const sun = (ctx, r, stops) => {
  const fill = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.05, 0, 0, r);
  stops.forEach(([at, color]) => fill.addColorStop(at, color));
  disc(ctx, 0, 0, r, fill);
};

// Pontas de luz em volta da estrela.
const rays = (ctx, r, count, reach, color) => {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * TAU;
    const long = i % 2 === 0 ? reach : 1 + (reach - 1) * 0.55;
    const half = (TAU / count) * 0.28;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle - half) * r * 0.92, Math.sin(angle - half) * r * 0.92);
    ctx.lineTo(Math.cos(angle) * r * long, Math.sin(angle) * r * long);
    ctx.lineTo(Math.cos(angle + half) * r * 0.92, Math.sin(angle + half) * r * 0.92);
    ctx.closePath();
    ctx.fill();
  }
};

export const drawRedStarGlow = (ctx, r) => {
  halo(ctx, r, EMBER, 1.32, 0.55);
  rays(ctx, r, 16, 1.2, hsl([30, 100, 62], 0, 0.55));
};

export const drawRedStar = (ctx, r) => {
  sun(ctx, r, [[0, hsl([48, 100, 78])], [0.45, hsl([28, 100, 60])], [0.85, hsl(EMBER)], [1, hsl([0, 90, 46])]]);
  ctx.save();
  clipDisc(ctx, r);
  for (let i = 0; i < 14; i += 1) {
    const angle = noise(i, 21) * TAU;
    const reach = (0.3 + noise(i, 22) * 0.6) * r;
    blob(ctx, Math.cos(angle) * reach, Math.sin(angle) * reach, r * (0.1 + noise(i, 23) * 0.12), r * 0.06, angle + 1.2, hsl([44, 100, 74], 0, 0.35));
  }
  for (let i = 0; i < 6; i += 1) {
    const angle = noise(i, 24) * TAU;
    disc(ctx, Math.cos(angle) * r * 0.78, Math.sin(angle) * r * 0.78, r * 0.07, hsl([0, 80, 38], 0, 0.3));
  }
  ctx.restore();
  face(ctx, r, { ink: '#5a0f08', blush: 'rgba(255, 240, 150, 0.55)', scale: 0.72 });
};

export const drawBlueStarGlow = (ctx, r) => {
  halo(ctx, r, AZURE, 1.33, 0.7);
  rays(ctx, r, 8, 1.3, 'rgba(200, 230, 255, 0.5)');
};

export const drawBlueStar = (ctx, r) => {
  sun(ctx, r, [[0, '#ffffff'], [0.35, hsl([200, 100, 88])], [0.8, hsl(AZURE)], [1, hsl([228, 90, 52])]]);
  ctx.save();
  clipDisc(ctx, r);
  for (let i = 0; i < 12; i += 1) {
    const angle = noise(i, 31) * TAU;
    const reach = (0.35 + noise(i, 32) * 0.55) * r;
    blob(ctx, Math.cos(angle) * reach, Math.sin(angle) * reach, r * (0.12 + noise(i, 33) * 0.1), r * 0.05, angle + 1.4, 'rgba(255, 255, 255, 0.3)');
  }
  ctx.restore();
  face(ctx, r, { ink: '#10266e', blush: 'rgba(255, 170, 220, 0.5)', mood: 'wow', scale: 0.68, y: -0.04 });
};

export const drawGalaxyGlow = (ctx, r) => {
  halo(ctx, r, VIOLET, 1.3, 0.6);
};

const spiralArm = (ctx, r, turn, color) => {
  for (let i = 0; i < 56; i += 1) {
    const t = i / 56;
    const angle = turn + t * 4.4;
    const reach = (0.16 + 0.76 * t) * r;
    const wobble = (noise(i, turn + 1) - 0.5) * r * 0.1;
    const size = r * (0.085 - 0.05 * t) * (0.7 + noise(i, turn + 2) * 0.6);
    disc(ctx, Math.cos(angle) * (reach + wobble), Math.sin(angle) * (reach + wobble), size, hsl(color, noise(i, 7) * 16, 0.5 - t * 0.2));
  }
};

export const drawGalaxy = (ctx, r) => {
  sun(ctx, r, [[0, hsl([270, 70, 34])], [0.7, hsl([255, 70, 20])], [1, hsl([248, 75, 12])]]);
  ctx.save();
  clipDisc(ctx, r);
  ctx.globalCompositeOperation = 'lighter';
  spiralArm(ctx, r, 0, [318, 95, 62]);
  spiralArm(ctx, r, TAU / 3, [190, 95, 60]);
  spiralArm(ctx, r, (TAU * 2) / 3, [268, 95, 68]);
  for (let i = 0; i < 40; i += 1) {
    const angle = noise(i, 41) * TAU;
    const reach = Math.sqrt(noise(i, 42)) * r * 0.94;
    disc(ctx, Math.cos(angle) * reach, Math.sin(angle) * reach, r * (0.008 + noise(i, 43) * 0.014), 'rgba(255, 255, 255, 0.85)');
  }
  ctx.globalCompositeOperation = 'source-over';
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
  core.addColorStop(0, 'rgba(255, 252, 230, 1)');
  core.addColorStop(0.55, 'rgba(255, 214, 150, 0.9)');
  core.addColorStop(1, 'rgba(255, 150, 220, 0)');
  disc(ctx, 0, 0, r * 0.42, core);
  ctx.restore();
  ctx.strokeStyle = hsl(VIOLET, 14, 0.75);
  ctx.lineWidth = r * 0.035;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, TAU);
  ctx.stroke();
  face(ctx, r, { ink: '#3a1560', blush: 'rgba(255, 110, 170, 0.55)', scale: 0.4, y: -0.02 });
};
