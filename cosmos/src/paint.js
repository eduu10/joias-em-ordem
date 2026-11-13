// Pinceis usados para desenhar os corpos celestes. Tudo e desenhado em volta do ponto (0, 0).
import { hsl } from './draw.js';

export const TAU = Math.PI * 2;

// Ruido fixo: o mesmo indice da sempre o mesmo valor entre 0 e 1.
export const noise = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export const disc = (ctx, x, y, radius, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
};

export const blob = (ctx, x, y, rx, ry, angle, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
  ctx.fill();
};

export const clipDisc = (ctx, radius) => {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.clip();
};

// Bola com cor de base e uma borda um pouco mais escura. A luz vem depois, em `shade`.
export const ball = (ctx, r, color) => {
  const fill = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r);
  fill.addColorStop(0, hsl(color, 8));
  fill.addColorStop(0.7, hsl(color));
  fill.addColorStop(1, hsl(color, -12));
  disc(ctx, 0, 0, r, fill);
};

export const crater = (ctx, x, y, radius, color) => {
  disc(ctx, x, y, radius, hsl(color, -16));
  disc(ctx, x + radius * 0.12, y + radius * 0.16, radius * 0.78, hsl(color, -8));
  ctx.strokeStyle = hsl(color, 14, 0.7);
  ctx.lineWidth = Math.max(0.5, radius * 0.2);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0.5, 2.4);
  ctx.stroke();
};

// Faixas horizontais levemente onduladas. `stripes`: [[y, altura, cor]] em fracoes do raio.
export const bands = (ctx, r, stripes) => {
  stripes.forEach(([y, height, fill], index) => {
    const wave = r * 0.05 * (index % 2 === 0 ? 1 : -1);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(-r, y * r);
    ctx.bezierCurveTo(-r * 0.4, y * r + wave, r * 0.4, y * r - wave, r, y * r);
    ctx.lineTo(r, (y + height) * r);
    ctx.bezierCurveTo(r * 0.4, (y + height) * r - wave, -r * 0.4, (y + height) * r + wave, -r, (y + height) * r);
    ctx.closePath();
    ctx.fill();
  });
};

const eye = (ctx, x, y, size, ink, mood) => {
  if (mood === 'sleepy') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = size * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size, 0.25, Math.PI - 0.25);
    ctx.stroke();
    return;
  }
  blob(ctx, x, y, size, size * 1.15, 0, ink);
  disc(ctx, x - size * 0.3, y - size * 0.4, size * 0.38, 'rgba(255, 255, 255, 0.95)');
  disc(ctx, x + size * 0.3, y + size * 0.35, size * 0.18, 'rgba(255, 255, 255, 0.7)');
};

// Carinha simples. `options`: { ink, blush, mood: 'happy' | 'sleepy' | 'wow', y, scale }
export const face = (ctx, r, options = {}) => {
  const { ink = '#2a1a4a', blush = 'rgba(255, 120, 150, 0.4)', mood = 'happy', y = 0, scale = 1 } = options;
  const s = r * scale;
  const cy = y * r;
  blob(ctx, -s * 0.5, cy + s * 0.2, s * 0.15, s * 0.09, 0, blush);
  blob(ctx, s * 0.5, cy + s * 0.2, s * 0.15, s * 0.09, 0, blush);
  eye(ctx, -s * 0.28, cy, s * 0.1, ink, mood);
  eye(ctx, s * 0.28, cy, s * 0.1, ink, mood);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = Math.max(0.6, s * 0.055);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'wow') {
    ctx.ellipse(0, cy + s * 0.24, s * 0.08, s * 0.1, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.arc(0, cy + s * 0.1, s * 0.14, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
};

// Luz e sombra por cima do corpo. Nao gira junto com ele, entao a luz vem sempre do mesmo lado.
export const shade = (ctx, r, strength = 1) => {
  const light = ctx.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, -r * 0.1, -r * 0.1, r * 1.1);
  light.addColorStop(0, `rgba(255, 255, 255, ${0.42 * strength})`);
  light.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
  light.addColorStop(0.72, 'rgba(10, 0, 40, 0)');
  light.addColorStop(1, `rgba(10, 0, 40, ${0.5 * strength})`);
  disc(ctx, 0, 0, r, light);
  blob(ctx, -r * 0.4, -r * 0.5, r * 0.26, r * 0.13, -0.65, `rgba(255, 255, 255, ${0.6 * strength})`);
  disc(ctx, -r * 0.66, -r * 0.2, r * 0.05, `rgba(255, 255, 255, ${0.5 * strength})`);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * strength})`;
  ctx.lineWidth = Math.max(0.6, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.93, 0.35, 1.25);
  ctx.stroke();
};

// Brilho em volta do corpo (estrelas e galaxia). `reach` e ate onde vai, em raios.
export const halo = (ctx, r, color, reach, alpha = 0.6) => {
  const glow = ctx.createRadialGradient(0, 0, r * 0.75, 0, 0, r * reach);
  glow.addColorStop(0, hsl(color, 0, alpha));
  glow.addColorStop(1, hsl(color, 0, 0));
  disc(ctx, 0, 0, r * reach, glow);
};
