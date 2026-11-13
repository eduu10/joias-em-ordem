// Cada corpo celeste e desenhado uma vez em canvas auxiliares e depois so copiado a cada quadro.
// Tres camadas: brilho de fundo (parado), corpo (gira) e luz/sombra (parada).
import { TIERS } from './config.js';
import { shade } from './paint.js';
import { drawGasGiant, drawIceGiant, drawMeteor, drawMoon, drawOcean, drawRinged, drawRocky } from './planets.js';
import { drawBlueStar, drawBlueStarGlow, drawGalaxy, drawGalaxyGlow, drawRedStar, drawRedStarGlow } from './stars.js';

// Folga em volta do raio para caber aneis e brilhos.
const MARGIN = 1.36;
const MAX_DETAIL = 3;
const SQUASH = 0.16;

// `light`: forca da luz/sombra. `body`: fracao do raio coberta pela luz.
const ART = Object.freeze([
  { base: drawMeteor, light: 1, body: 1 },
  { base: drawMoon, light: 1, body: 1 },
  { base: drawRocky, light: 1, body: 1 },
  { base: drawOcean, light: 1, body: 1 },
  { base: drawRinged, light: 0.9, body: 0.9 },
  { base: drawGasGiant, light: 1, body: 1 },
  { base: drawIceGiant, light: 1, body: 1 },
  { base: drawRedStar, glow: drawRedStarGlow, light: 0.45, body: 1 },
  { base: drawBlueStar, glow: drawBlueStarGlow, light: 0.35, body: 1 },
  { base: drawGalaxy, glow: drawGalaxyGlow, light: 0.3, body: 1 },
].map(Object.freeze));

const layer = (radius, detail, paint) => {
  const canvas = document.createElement('canvas');
  const size = Math.ceil(radius * MARGIN * 2 * detail);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(detail, 0, 0, detail, size / 2, size / 2);
  paint(ctx, radius);
  return canvas;
};

// `pixelsPerUnit`: quantos pixels de tela vale uma unidade do espaco de desenho.
export const buildSprites = (pixelsPerUnit) => {
  const detail = Math.min(MAX_DETAIL, Math.max(1, pixelsPerUnit));
  return TIERS.map((tier, index) => {
    const art = ART[index];
    return Object.freeze({
      under: art.glow ? layer(tier.radius, detail, art.glow) : null,
      base: layer(tier.radius, detail, art.base),
      over: layer(tier.radius, detail, (ctx, r) => shade(ctx, r * art.body, art.light)),
    });
  });
};

// `options`: { rot, squash (0 a 1), alpha }
export const drawBody = (ctx, sprites, tier, x, y, radius, options = {}) => {
  const { rot = 0, squash = 0, alpha = 1 } = options;
  const sprite = sprites[tier];
  const half = radius * MARGIN;
  const stretch = squash * SQUASH;
  ctx.save();
  ctx.globalAlpha *= alpha;
  // Amassa para baixo, como se o corpo tivesse batido no chao.
  ctx.translate(x, y + radius * stretch);
  ctx.scale(1 + stretch, 1 - stretch);
  if (sprite.under) ctx.drawImage(sprite.under, -half, -half, half * 2, half * 2);
  ctx.rotate(rot);
  ctx.drawImage(sprite.base, -half, -half, half * 2, half * 2);
  ctx.rotate(-rot);
  ctx.drawImage(sprite.over, -half, -half, half * 2, half * 2);
  ctx.restore();
};
