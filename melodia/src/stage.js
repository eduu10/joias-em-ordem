// Palco: fundo com holofotes e notas flutuando, o disco que gira, o equalizador e o anel do tempo.
// Tudo desenhado a partir do tempo e do estado recebido. Nao guarda nem altera nada.
import { roundRectPath } from './draw.js';

const TAU = Math.PI * 2;
const NOTE_COUNT = 16;
const BEAMS = Object.freeze([
  { at: 0.12, hue: 48, speed: 0.5, phase: 0 },
  { at: 0.38, hue: 322, speed: 0.37, phase: 1.7 },
  { at: 0.64, hue: 176, speed: 0.44, phase: 3.1 },
  { at: 0.9, hue: 276, speed: 0.31, phase: 4.6 },
]);

// Numero "aleatorio" fixo por indice: o fundo e igual a cada quadro sem guardar estado.
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const drawNoteGlyph = (ctx, x, y, size, color, double = false) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  const heads = double ? [-size * 0.5, size * 0.5] : [0];
  heads.forEach((hx) => {
    ctx.beginPath();
    ctx.ellipse(hx, size * 0.5, size * 0.34, size * 0.25, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + size * 0.3, size * 0.45);
    ctx.lineTo(hx + size * 0.3, -size * 0.6);
    ctx.stroke();
  });
  ctx.beginPath();
  if (double) {
    ctx.lineWidth = size * 0.24;
    ctx.moveTo(-size * 0.2, -size * 0.6);
    ctx.lineTo(size * 0.8, -size * 0.6);
  } else {
    ctx.moveTo(size * 0.3, -size * 0.6);
    ctx.quadraticCurveTo(size * 0.85, -size * 0.35, size * 0.6, size * 0.05);
  }
  ctx.stroke();
  ctx.restore();
};

const drawBeams = (ctx, width, height, time, energy) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  BEAMS.forEach((beam) => {
    const x = width * beam.at;
    const sway = Math.sin(time * beam.speed + beam.phase) * 0.32;
    const reach = height * 1.05;
    const spread = width * 0.16;
    const tx = x + Math.sin(sway) * reach;
    const fill = ctx.createLinearGradient(x, 0, tx, reach);
    fill.addColorStop(0, `hsl(${beam.hue} 95% 70% / ${0.2 + energy * 0.14})`);
    fill.addColorStop(1, `hsl(${beam.hue} 95% 60% / 0)`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x - 4, -10);
    ctx.lineTo(x + 4, -10);
    ctx.lineTo(tx + spread, reach);
    ctx.lineTo(tx - spread, reach);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
};

const drawFloatingNotes = (ctx, width, height, time) => {
  const unit = Math.min(width, height);
  for (let i = 0; i < NOTE_COUNT; i += 1) {
    const size = unit * (0.022 + hash(i) * 0.03);
    const travel = height + size * 6;
    const y = height + size * 3 - ((time * (14 + hash(i + 40) * 22) + hash(i + 80) * travel) % travel);
    const x = hash(i + 120) * width + Math.sin(time * (0.5 + hash(i + 160)) + i) * unit * 0.03;
    const fade = Math.min(1, y / (height * 0.25), (height - y) / (height * 0.2) + 0.2);
    const hue = [48, 176, 322, 276][i % 4];
    ctx.globalAlpha = Math.max(0, fade) * 0.28;
    drawNoteGlyph(ctx, x, y, size, `hsl(${hue} 90% 78%)`, i % 3 === 0);
  }
  ctx.globalAlpha = 1;
};

// Fundo que cobre a tela inteira (em pixels da tela), para nao sobrar faixa preta em nenhum formato.
export const drawBackdrop = (ctx, view, time, energy = 0) => {
  const { width, height } = view;
  ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#12062e');
  sky.addColorStop(0.55, '#2c0f55');
  sky.addColorStop(1, '#5a1458');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  drawBeams(ctx, width, height, time, energy);
  const glow = ctx.createRadialGradient(width / 2, height * 1.05, 0, width / 2, height * 1.05, Math.max(width, height) * 0.6);
  glow.addColorStop(0, `rgba(255, 140, 90, ${0.34 + energy * 0.2})`);
  glow.addColorStop(1, 'rgba(255, 140, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  drawFloatingNotes(ctx, width, height, time);
  const shade = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.75);
  shade.addColorStop(0, 'rgba(8, 2, 24, 0)');
  shade.addColorStop(1, 'rgba(8, 2, 24, 0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
};

// Disco de vinil. `spin` em radianos, `hue` da etiqueta, `pulse` de 0 a 1 faz o brilho bater com a musica.
export const drawVinyl = (ctx, x, y, radius, spin, hue, pulse = 0) => {
  ctx.save();
  ctx.translate(x, y);
  const halo = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * (1.35 + pulse * 0.15));
  halo.addColorStop(0, `hsl(${hue} 95% 65% / ${0.35 + pulse * 0.35})`);
  halo.addColorStop(1, `hsl(${hue} 95% 65% / 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.5, 0, TAU);
  ctx.fill();

  ctx.rotate(spin);
  ctx.fillStyle = '#120a1e';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1;
  for (let ring = 0.46; ring < 0.97; ring += 0.085) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * ring, 0, TAU);
    ctx.stroke();
  }
  // Reflexos em cunha deixam o giro visivel.
  [0, Math.PI].forEach((angle) => {
    const shine = ctx.createLinearGradient(0, 0, Math.cos(angle) * radius, Math.sin(angle) * radius);
    shine.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
    shine.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.98, angle - 0.22, angle + 0.22);
    ctx.closePath();
    ctx.fill();
  });
  const label = ctx.createLinearGradient(-radius * 0.4, -radius * 0.4, radius * 0.4, radius * 0.4);
  label.addColorStop(0, `hsl(${hue} 90% 68%)`);
  label.addColorStop(1, `hsl(${hue + 40} 85% 48%)`);
  ctx.fillStyle = label;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = radius * 0.025;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.33, 0.3, 2.2);
  ctx.stroke();
  ctx.restore();
};

// Barras do equalizador. `bars` sao valores de 0 a 1; a cor vai do verde-agua ao dourado e ao rosa.
export const drawEqualiser = (ctx, rect, bars, time) => {
  const gap = 3;
  const barW = (rect.w - gap * (bars.length - 1)) / bars.length;
  bars.forEach((value, index) => {
    const idle = 0.08 + 0.05 * Math.sin(time * 3 + index * 0.9);
    const level = Math.min(1, Math.max(idle, value));
    const h = Math.max(3, rect.h * level);
    const x = rect.x + index * (barW + gap);
    const hue = 176 - (index / bars.length) * 190;
    const fill = ctx.createLinearGradient(0, rect.y + rect.h - h, 0, rect.y + rect.h);
    fill.addColorStop(0, `hsl(${hue} 95% 72%)`);
    fill.addColorStop(1, `hsl(${hue} 90% 48% / 0.55)`);
    ctx.fillStyle = fill;
    roundRectPath(ctx, x, rect.y + rect.h - h, barW, h, barW / 2);
    ctx.fill();
  });
};

// Anel do tempo em volta do disco: `share` de 1 (cheio) a 0 (acabou).
export const drawTimerRing = (ctx, x, y, radius, share, time) => {
  const urgent = share < 0.3;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
  if (share <= 0) return;
  const hue = 40 + share * 120;
  const beat = urgent ? 0.5 + 0.5 * Math.sin(time * 14) : 0;
  ctx.strokeStyle = `hsl(${urgent ? 352 : hue} 95% ${62 + beat * 14}%)`;
  ctx.lineWidth = 7 + beat * 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, share));
  ctx.stroke();
};
