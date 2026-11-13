// Cenario parado: a caverna, os cristais das paredes, o tabuleiro de pedra e a bandeja.
// E desenhado uma vez num canvas auxiliar e depois so copiado a cada quadro.
import { BOARD, DESIGN, GRID, TRAY } from './config.js';
import { roundRectPath } from './draw.js';

const TAU = Math.PI * 2;
const FRAME = 10;
const SHARDS = Object.freeze([[-0.78, 30, 10], [0.7, 34, 10], [-0.38, 50, 13], [0.34, 46, 12], [0, 68, 16]]);

const noise = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const drawRock = (ctx, b) => {
  const fill = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  fill.addColorStop(0, '#090716');
  fill.addColorStop(0.45, '#17123a');
  fill.addColorStop(1, '#0a1626');
  ctx.fillStyle = fill;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  for (let i = 0; i < 22; i += 1) {
    const x = b.x + noise(i, 1) * b.w;
    const y = b.y + noise(i, 2) * b.h;
    const radius = 50 + noise(i, 3) * 90;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `hsl(${220 + noise(i, 4) * 80} 70% 55% / ${0.05 + noise(i, 5) * 0.06})`);
    glow.addColorStop(1, 'hsl(240 70% 55% / 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // Veios escuros na rocha.
  ctx.strokeStyle = 'rgba(4, 3, 14, 0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 16; i += 1) {
    const x = b.x + noise(i, 6) * b.w;
    const y = b.y + noise(i, 7) * b.h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (noise(i, 8) - 0.5) * 50, y + 14 + noise(i, 9) * 24);
    ctx.lineTo(x + (noise(i, 10) - 0.5) * 70, y + 34 + noise(i, 11) * 40);
    ctx.stroke();
  }
};

// Estalactites no teto e estalagmites no chao, como silhuetas.
const drawSpikes = (ctx, b) => {
  const count = Math.ceil(b.w / 22) + 1;
  [[b.y, 1, 12], [b.y + b.h, -1, 13]].forEach(([edge, direction, salt]) => {
    for (let i = 0; i < count; i += 1) {
      const x = b.x + i * 22 + (noise(i, salt) - 0.5) * 14;
      const width = 16 + noise(i, salt + 2) * 22;
      const length = 10 + noise(i, salt + 4) ** 2 * 34;
      ctx.fillStyle = `hsl(250 40% ${5 + noise(i, salt + 6) * 5}%)`;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, edge);
      ctx.lineTo(x + (noise(i, salt + 8) - 0.5) * 6, edge + length * direction);
      ctx.lineTo(x + width / 2, edge);
      ctx.closePath();
      ctx.fill();
    }
  });
};

const drawShard = (ctx, hue, length, width) => {
  const shoulder = -length * 0.74;
  [[-1, 62, 68], [1, 40, 62]].forEach(([side, light, sat]) => {
    ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo((side * width) / 2, 2);
    ctx.lineTo((side * width) / 2, shoulder);
    ctx.lineTo(0, -length);
    ctx.closePath();
    ctx.fill();
  });
  ctx.strokeStyle = `hsl(${hue} 90% 86% / 0.7)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(0, -length);
  ctx.stroke();
};

const drawCluster = (ctx, spot) => {
  const glow = ctx.createRadialGradient(spot.gx, spot.gy, 0, spot.gx, spot.gy, spot.r);
  glow.addColorStop(0, `hsl(${spot.hue} 85% 62% / 0.4)`);
  glow.addColorStop(1, `hsl(${spot.hue} 85% 62% / 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(spot.gx - spot.r, spot.gy - spot.r, spot.r * 2, spot.r * 2);
  SHARDS.forEach(([lean, length, width], index) => {
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.rotate(spot.angle + lean);
    drawShard(ctx, spot.hue + (index - 2) * 7, length * spot.size, width * spot.size);
    ctx.restore();
  });
};

// Grupos de cristais presos aos cantos da tela. Em telas largas ou altas aparecem grupos extras.
const clusterSpots = (b) => {
  const right = b.x + b.w;
  const bottom = b.y + b.h;
  const side = -b.x;
  const corners = [
    { x: b.x + 22, y: bottom + 4, angle: 0.3, size: 1.1, hue: 188 },
    { x: right - 22, y: bottom + 4, angle: -0.3, size: 1.1, hue: 282 },
    { x: b.x + 14, y: b.y - 4, angle: Math.PI - 0.35, size: 0.85, hue: 312 },
    { x: right - 14, y: b.y - 4, angle: Math.PI + 0.35, size: 0.85, hue: 168 },
  ];
  const big = Math.min(2.6, side / 62);
  const wide = side > 60 ? [
    { x: b.x + side * 0.5, y: bottom + 6, angle: 0.1, size: big, hue: 205 },
    { x: right - side * 0.5, y: bottom + 6, angle: -0.1, size: big, hue: 265 },
    { x: b.x + side * 0.45, y: b.y - 6, angle: Math.PI + 0.12, size: big * 0.7, hue: 300 },
    { x: right - side * 0.45, y: b.y - 6, angle: Math.PI - 0.12, size: big * 0.7, hue: 180 },
    { x: b.x - 6, y: b.y + b.h * 0.5, angle: Math.PI / 2 + 0.15, size: big * 0.6, hue: 230 },
    { x: right + 6, y: b.y + b.h * 0.52, angle: -Math.PI / 2 - 0.15, size: big * 0.6, hue: 195 },
  ] : [];
  const tall = -b.y > 40 ? [
    { x: b.x + b.w * 0.62, y: bottom + 6, angle: 0.06, size: Math.min(1.5, -b.y / 50), hue: 225 },
    { x: b.x + b.w * 0.36, y: b.y - 6, angle: Math.PI - 0.05, size: Math.min(1.2, -b.y / 60), hue: 255 },
  ] : [];
  return [...corners, ...wide, ...tall].map((spot, index) => ({
    ...spot,
    gx: spot.x + Math.sin(spot.angle) * 34 * spot.size,
    gy: spot.y - Math.cos(spot.angle) * 34 * spot.size,
    r: 84 * spot.size,
    phase: index * 1.7,
  }));
};

const drawCells = (ctx) => {
  for (let index = 0; index < GRID * GRID; index += 1) {
    const x = BOARD.x + (index % GRID) * BOARD.cell;
    const y = BOARD.y + Math.floor(index / GRID) * BOARD.cell;
    // Casa cavada: sombra em cima, luz embaixo.
    roundRectPath(ctx, x + 1.5, y + 1.5, BOARD.cell - 3, BOARD.cell - 3, 7);
    ctx.fillStyle = 'rgba(160, 170, 255, 0.13)';
    ctx.fill();
    const well = ctx.createLinearGradient(0, y, 0, y + BOARD.cell);
    well.addColorStop(0, '#0d0b1f');
    well.addColorStop(1, '#1b1838');
    roundRectPath(ctx, x + 1.5, y + 1.5, BOARD.cell - 3, BOARD.cell - 4.2, 7);
    ctx.fillStyle = well;
    ctx.fill();
    roundRectPath(ctx, x + 3.5, y + 4.5, BOARD.cell - 7, BOARD.cell - 8, 5);
    ctx.fillStyle = 'rgba(54, 50, 108, 0.5)';
    ctx.fill();
  }
};

const drawBoard = (ctx) => {
  const x = BOARD.x - FRAME;
  const y = BOARD.y - FRAME;
  const size = BOARD.size + FRAME * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  const stone = ctx.createLinearGradient(0, y, 0, y + size);
  stone.addColorStop(0, '#5b5682');
  stone.addColorStop(1, '#302c52');
  roundRectPath(ctx, x, y, size, size, 16);
  ctx.fillStyle = stone;
  ctx.fill();
  ctx.restore();
  // Chanfro: luz no alto, sombra embaixo.
  roundRectPath(ctx, x + 1, y + 1, size - 2, size - 2, 15);
  ctx.strokeStyle = 'rgba(210, 205, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  roundRectPath(ctx, x + 2, y + 4, size - 4, size - 5, 14);
  ctx.strokeStyle = 'rgba(12, 10, 34, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 70; i += 1) {
    ctx.fillStyle = `rgba(${noise(i, 20) > 0.5 ? '220, 215, 255' : '10, 8, 30'}, ${0.08 + noise(i, 21) * 0.12})`;
    ctx.fillRect(x + 3 + noise(i, 22) * (size - 6), y + 3 + noise(i, 23) * (size - 6), 1.6, 1.2);
  }
  roundRectPath(ctx, BOARD.x - 3, BOARD.y - 3, BOARD.size + 6, BOARD.size + 6, 9);
  ctx.fillStyle = '#100e24';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawCells(ctx);
};

const drawTrayLedge = (ctx) => {
  const x = BOARD.x - FRAME;
  const w = BOARD.size + FRAME * 2;
  const h = TRAY.bottom - TRAY.top;
  const fill = ctx.createLinearGradient(0, TRAY.top, 0, TRAY.bottom);
  fill.addColorStop(0, 'rgba(34, 30, 72, 0.72)');
  fill.addColorStop(1, 'rgba(16, 14, 40, 0.72)');
  roundRectPath(ctx, x, TRAY.top, w, h, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 160, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  TRAY.slots.forEach((center) => {
    const glow = ctx.createRadialGradient(center, TRAY.y, 4, center, TRAY.y, 56);
    glow.addColorStop(0, 'rgba(120, 140, 255, 0.13)');
    glow.addColorStop(1, 'rgba(120, 140, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center, TRAY.y, 56, 0, TAU);
    ctx.fill();
  });
};

const drawVignette = (ctx, b) => {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const shade = ctx.createRadialGradient(cx, cy, Math.min(b.w, b.h) * 0.42, cx, cy, Math.hypot(b.w, b.h) * 0.56);
  shade.addColorStop(0, 'rgba(3, 2, 12, 0)');
  shade.addColorStop(1, 'rgba(3, 2, 12, 0.62)');
  ctx.fillStyle = shade;
  ctx.fillRect(b.x, b.y, b.w, b.h);
};

// `view`: { width, height, ratio, scale, ox, oy } em pixels de tela.
// Devolve o canvas pronto e os pontos de luz que o ambiente anima por cima.
export const buildWorld = (view) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(view.width * view.ratio);
  canvas.height = Math.round(view.height * view.ratio);
  const ctx = canvas.getContext('2d');
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  const bounds = { x: -view.ox / view.scale, y: -view.oy / view.scale, w: view.width / view.scale, h: view.height / view.scale };
  const glows = clusterSpots(bounds);

  drawRock(ctx, bounds);
  glows.forEach((spot) => drawCluster(ctx, spot));
  drawSpikes(ctx, bounds);
  drawVignette(ctx, bounds);
  drawTrayLedge(ctx);
  drawBoard(ctx);
  return { canvas, glows, center: DESIGN.w / 2 };
};
