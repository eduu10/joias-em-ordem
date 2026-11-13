// Desenho de um cristal lapidado: base escura, quatro facetas, mesa no centro e brilhos.
import { hsl, roundRectPath } from './draw.js';

const TAU = Math.PI * 2;

const facet = (ctx, points, fill) => {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};

// Estrela de quatro pontas usada nos brilhos.
export const drawSparkle = (ctx, x, y, radius, alpha = 1) => {
  if (alpha <= 0 || radius <= 0) return;
  const thin = radius * 0.22;
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + thin, y - thin, x + radius, y);
  ctx.quadraticCurveTo(x + thin, y + thin, x, y + radius);
  ctx.quadraticCurveTo(x - thin, y + thin, x - radius, y);
  ctx.quadraticCurveTo(x - thin, y - thin, x, y - radius);
  ctx.fill();
};

const drawFacets = (ctx, color, o, i) => {
  facet(ctx, [[-o, -o], [o, -o], [i, -i], [-i, -i]], hsl(color, 20));
  facet(ctx, [[-o, -o], [-i, -i], [-i, i], [-o, o]], hsl(color, 7));
  facet(ctx, [[o, -o], [o, o], [i, i], [i, -i]], hsl(color, -11));
  facet(ctx, [[-o, o], [-i, i], [i, i], [o, o]], hsl(color, -20));
  const table = ctx.createLinearGradient(-i, -i, i, i);
  table.addColorStop(0, hsl(color, 14));
  table.addColorStop(1, hsl(color, -5));
  ctx.fillStyle = table;
  ctx.fillRect(-i, -i, i * 2, i * 2);
  // Reflexo na mesa e ponto de luz no canto.
  facet(ctx, [[-i, -i], [i * 0.5, -i], [-i, i * 0.5]], 'rgba(255, 255, 255, 0.3)');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-o * 0.76, -o * 0.76, o * 0.085, 0, TAU);
  ctx.fill();
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x canto esquerdo da casa
 * @param {number} y canto de cima da casa
 * @param {number} size lado da casa
 * @param {number[]} color [matiz, saturacao, luz]
 * @param {{alpha?: number, flash?: number, scale?: number, squash?: number, glow?: number}} options
 */
export const drawGem = (ctx, x, y, size, color, options = {}) => {
  const { alpha = 1, flash = 0, scale = 1, squash = 0, glow = 0 } = options;
  if (alpha <= 0 || scale <= 0) return;
  const half = size * 0.465;
  const radius = half * 0.34;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x + size / 2, y + size / 2);
  ctx.scale(scale * (1 + squash), scale * (1 - squash));
  if (glow > 0) {
    ctx.shadowColor = hsl(color, 12, glow);
    ctx.shadowBlur = size * 0.5;
  }
  roundRectPath(ctx, -half, -half, half * 2, half * 2, radius);
  ctx.fillStyle = hsl(color, -27);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  drawFacets(ctx, color, half * 0.86, half * 0.48);
  roundRectPath(ctx, -half, -half, half * 2, half * 2, radius);
  ctx.strokeStyle = hsl(color, 24, 0.55);
  ctx.lineWidth = Math.max(0.6, size * 0.03);
  ctx.stroke();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flash)})`;
    ctx.fill();
  }
  ctx.restore();
};
