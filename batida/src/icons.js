// Pictogramas das pistas e miniatura do carro na garagem. So desenha.
import { buildCar } from './carbody.js';
import { drawCar } from './cardraw.js';
import { drawText } from './draw.js';

const sky = (ctx, x, y, w, h) => {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#7cc4ef');
  g.addColorStop(1, '#d9f0ff');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#4c4f57';
  ctx.fillRect(x, y + h - 14, w, 14);
  ctx.fillStyle = '#ffd21f';
  ctx.fillRect(x + 4, y + h - 8, w - 8, 2);
};

const carBlock = (ctx, x, y, color = '#e8432e') => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 12, 34, 10);
  ctx.fillRect(x + 8, y - 20, 16, 9);
  ctx.fillStyle = '#1b1c20';
  [x + 7, x + 27].forEach((cx) => { ctx.beginPath(); ctx.arc(cx, y - 2, 4, 0, Math.PI * 2); ctx.fill(); });
};

const ICONS = Object.freeze({
  wall: (ctx, x, y, w, h) => { carBlock(ctx, x + 30, y + h - 14); ctx.fillStyle = '#b9b3aa'; ctx.fillRect(x + w - 50, y + 10, 18, h - 24); },
  post: (ctx, x, y, w, h) => {
    carBlock(ctx, x + 30, y + h - 14);
    for (let i = 0; i < 4; i += 1) { ctx.fillStyle = i % 2 ? '#141414' : '#ffd21f'; ctx.fillRect(x + w - 50, y + h - 14 - (i + 1) * 6, 10, 6); }
  },
  cones: (ctx, x, y, w, h) => {
    carBlock(ctx, x + 6, y + h - 14);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(x + 52 + i * 14, y + h - 26);
      ctx.lineTo(x + 57 + i * 14, y + h - 14);
      ctx.lineTo(x + 47 + i * 14, y + h - 14);
      ctx.fill();
    }
  },
  ramp: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#e9a23b';
    ctx.beginPath();
    ctx.moveTo(x + 20, y + h - 14);
    ctx.lineTo(x + 60, y + h - 34);
    ctx.lineTo(x + 60, y + h - 14);
    ctx.fill();
    ctx.fillStyle = '#3d7bd9';
    [[80, 0], [92, 0], [104, 0], [86, 1], [98, 1], [92, 2]].forEach(([bx, row]) => ctx.fillRect(x + bx, y + h - 26 - row * 12, 10, 12));
  },
  headon: (ctx, x, y, w, h) => { carBlock(ctx, x + 18, y + h - 14); carBlock(ctx, x + w - 52, y + h - 14, '#9aa0a8'); },
  cliff: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#9b7653';
    ctx.fillRect(x, y + 26, 60, h - 26);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x, y + 24, 60, 4);
    carBlock(ctx, x + 22, y + 24);
  },
});

export const drawTrackIcon = (ctx, id, x, y, w, h, locked) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  sky(ctx, x, y, w, h);
  ICONS[id]?.(ctx, x, y, w, h);
  if (locked) {
    ctx.fillStyle = 'rgba(20, 25, 35, 0.55)';
    ctx.fillRect(x, y, w, h);
    drawText(ctx, '🔒', x + w / 2, y + h / 2, 26, { shadow: false });
  }
  ctx.restore();
};

const previews = new Map();

// Carro parado desenhado grande na garagem, centrado em (cx, groundY) no espaco de desenho.
export const drawCarPreview = (ctx, def, cx, groundY, width, time) => {
  if (!previews.has(def.id)) previews.set(def.id, buildCar(def, def.len / 2, 1));
  const body = previews.get(def.id);
  const ppm = Math.min(width / def.len, 150 / Math.max(...def.roof));
  const bob = Math.sin(time * 3) * 1.5;
  const cam = { x: 0, y: 0, ppm, ax: cx, ay: groundY + bob, w: 360, h: 640 };
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, def.len * ppm * 0.55, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCar(ctx, cam, body, def, []);
};
