// Gemas. Cada cor tem tambem um simbolo proprio, para quem nao distingue bem as cores.
// As gemas sao desenhadas uma vez num canvas auxiliar e depois so copiadas, o que deixa o jogo leve.
import { gemColor } from './draw.js';

const cache = new Map();

const polygon = (ctx, points, radius, rotation = -Math.PI / 2, innerRatio = 1) => {
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const r = i % 2 === 1 ? radius * innerRatio : radius;
    const angle = rotation + (i * Math.PI * 2) / points;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
};

const SYMBOLS = Object.freeze([
  (ctx, r) => { // coracao
    ctx.beginPath();
    ctx.moveTo(0, r * 0.95);
    ctx.bezierCurveTo(-r * 1.45, r * 0.05, -r * 0.75, -r * 1.05, 0, -r * 0.4);
    ctx.bezierCurveTo(r * 0.75, -r * 1.05, r * 1.45, r * 0.05, 0, r * 0.95);
  },
  (ctx, r) => { // gota
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.bezierCurveTo(r * 1.0, -r * 0.05, r * 0.85, r * 0.95, 0, r * 0.95);
    ctx.bezierCurveTo(-r * 0.85, r * 0.95, -r * 1.0, -r * 0.05, 0, -r * 1.05);
  },
  (ctx, r) => polygon(ctx, 10, r * 1.1, -Math.PI / 2, 0.45), // estrela
  (ctx, r) => polygon(ctx, 3, r * 1.1), // triangulo
  (ctx, r) => polygon(ctx, 4, r * 1.1), // losango
  (ctx, r) => polygon(ctx, 4, r * 1.05, Math.PI / 4), // quadrado
  (ctx, r) => { // cruz
    const arm = r * 0.36;
    ctx.beginPath();
    ctx.rect(-arm, -r, arm * 2, r * 2);
    ctx.rect(-r, -arm, r * 2, arm * 2);
  },
  (ctx, r) => { // lua
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.32, Math.PI * 1.68);
    ctx.arc(r * 0.5, 0, r * 0.78, Math.PI * 1.4, Math.PI * 0.6, true);
    ctx.closePath();
  },
  (ctx, r) => polygon(ctx, 6, r * 1.05, 0), // hexagono
]);

const paintGem = (ctx, color, size) => {
  const center = size / 2;
  const radius = size / 2 - 1;

  const body = ctx.createRadialGradient(center - radius * 0.35, center - radius * 0.42, radius * 0.05, center, center, radius);
  body.addColorStop(0, gemColor(color, 24));
  body.addColorStop(0.5, gemColor(color, 0));
  body.addColorStop(1, gemColor(color, -24));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = gemColor(color, -34, 0.75);
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.stroke();

  // Luz rebatida embaixo.
  ctx.strokeStyle = gemColor(color, 30, 0.45);
  ctx.lineWidth = radius * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.8, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  const symbol = SYMBOLS[color % SYMBOLS.length];
  ctx.save();
  ctx.translate(center, center + radius * 0.1);
  ctx.fillStyle = gemColor(color, -34, 0.55);
  symbol(ctx, radius * 0.4);
  ctx.fill();
  ctx.translate(0, -radius * 0.06);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  symbol(ctx, radius * 0.4);
  ctx.fill();
  ctx.restore();

  // Brilho no alto, o que da o aspecto de vidro polido.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(center - radius * 0.34, center - radius * 0.5, radius * 0.34, radius * 0.17, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(center + radius * 0.42, center - radius * 0.52, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
};

const spriteFor = (color, pixels) => {
  const key = `${color}:${pixels}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const sprite = document.createElement('canvas');
  sprite.width = pixels;
  sprite.height = pixels;
  paintGem(sprite.getContext('2d'), color, pixels);
  cache.set(key, sprite);
  return sprite;
};

export const clearSprites = () => cache.clear();

// `squash` de 0 a 1 achata a gema contra o chao (efeito de quique).
export const drawGem = (ctx, color, x, y, size, ratio, squash = 0) => {
  const sprite = spriteFor(color, Math.max(8, Math.round(size * ratio)));
  const w = size * (1 + squash * 0.2);
  const h = size * (1 - squash * 0.24);
  ctx.drawImage(sprite, x - w / 2, y + size / 2 - h, w, h);
};
