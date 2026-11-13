// Cenario parado: grama, caminho, arvores, caverna, castelo e pedestais.
// E desenhado uma vez num canvas auxiliar e depois so copiado a cada quadro.
import { BASE, DESIGN, PATH, SLOTS } from './config.js';

const TAU = Math.PI * 2;
const TREES = Object.freeze([[30, 96], [38, 196], [22, 318], [336, 200], [340, 330], [28, 452], [336, 508], [28, 590], [334, 600], [346, 128]]);
const ROCKS = Object.freeze([[18, 150], [330, 440], [150, 540], [226, 498], [52, 380]]);
const FLOWER_COUNT = 46;
const TUFT_COUNT = 70;

const noise = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const tracePath = (ctx) => {
  ctx.beginPath();
  PATH.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.lineTo(BASE.x, BASE.y);
};

const drawGround = (ctx, bounds) => {
  const grass = ctx.createLinearGradient(0, 0, 0, DESIGN.h);
  grass.addColorStop(0, '#8fd45a');
  grass.addColorStop(1, '#4fae45');
  ctx.fillStyle = grass;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = `rgba(255, 255, 190, ${0.05 + noise(i, 1) * 0.07})`;
    ctx.beginPath();
    ctx.ellipse(bounds.x + noise(i, 2) * bounds.w, bounds.y + noise(i, 3) * bounds.h, 30 + noise(i, 4) * 50, 16 + noise(i, 5) * 22, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(40, 120, 50, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < TUFT_COUNT; i += 1) {
    const x = bounds.x + noise(i, 6) * bounds.w;
    const y = bounds.y + noise(i, 7) * bounds.h;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 4, y - 5);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 7);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 4, y - 5);
    ctx.stroke();
  }
};

const drawRoad = (ctx) => {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  [['rgba(30, 70, 30, 0.35)', 52, 3], ['#8a6436', 46, 0], ['#d8b27a', 40, 0], ['#e7c893', 26, -1]].forEach(([color, width, shift]) => {
    ctx.save();
    ctx.translate(0, shift);
    tracePath(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  });
  for (let i = 0; i < 60; i += 1) {
    const [x1, y1] = PATH[Math.floor(noise(i, 8) * (PATH.length - 1))];
    const [x2, y2] = PATH[Math.min(PATH.length - 1, Math.floor(noise(i, 8) * (PATH.length - 1)) + 1)];
    const t = noise(i, 9);
    ctx.fillStyle = `rgba(120, 84, 44, ${0.25 + noise(i, 10) * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(x1 + (x2 - x1) * t + (noise(i, 11) - 0.5) * 30, y1 + (y2 - y1) * t + (noise(i, 12) - 0.5) * 30, 2.4, 1.6, 0, 0, TAU);
    ctx.fill();
  }
};

const drawFlowers = (ctx) => {
  const colors = ['#ffffff', '#ffe066', '#ff9ecb', '#b5a1ff'];
  for (let i = 0; i < FLOWER_COUNT; i += 1) {
    const x = noise(i, 13) * DESIGN.w;
    const y = noise(i, 14) * DESIGN.h;
    ctx.fillStyle = colors[i % colors.length];
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal * TAU) / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 2.2, y + Math.sin(angle) * 2.2, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, TAU);
    ctx.fill();
  }
};

const drawTree = (ctx, x, y) => {
  ctx.fillStyle = 'rgba(20, 70, 30, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 4, 19, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(x - 3, y - 12, 6, 16);
  [[0, -26, 17, '#2f8f3e'], [-9, -18, 12, '#35a047'], [9, -18, 12, '#2a8338'], [0, -31, 12, '#4cbb5a']].forEach(([dx, dy, r, color]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, TAU);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(x - 5, y - 35, 6, 0, TAU);
  ctx.fill();
};

const drawRock = (ctx, x, y) => {
  ctx.fillStyle = 'rgba(20, 60, 30, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 5, 12, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8d97a8';
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 7.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b9c1cf';
  ctx.beginPath();
  ctx.ellipse(x - 2.5, y - 2.5, 5, 3, -0.4, 0, TAU);
  ctx.fill();
};

const drawCave = (ctx) => {
  const [x, y] = PATH[0];
  ctx.fillStyle = 'rgba(20, 60, 30, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 40, 9, 0, 0, TAU);
  ctx.fill();
  const rock = ctx.createLinearGradient(0, y - 40, 0, y + 10);
  rock.addColorStop(0, '#9aa3b5');
  rock.addColorStop(1, '#646c7e');
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.moveTo(x - 38, y + 8);
  ctx.quadraticCurveTo(x - 36, y - 30, x - 10, y - 38);
  ctx.quadraticCurveTo(x + 8, y - 46, x + 24, y - 30);
  ctx.quadraticCurveTo(x + 42, y - 16, x + 38, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1b1430';
  ctx.beginPath();
  ctx.moveTo(x - 19, y + 8);
  ctx.quadraticCurveTo(x - 19, y - 22, x, y - 22);
  ctx.quadraticCurveTo(x + 19, y - 22, x + 19, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(190, 80, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 12, 5, 0, 0, TAU);
  ctx.fill();
};

const drawCastle = (ctx) => {
  const { x, y } = BASE;
  ctx.fillStyle = 'rgba(20, 60, 30, 0.38)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 42, 10, 0, 0, TAU);
  ctx.fill();

  const stone = ctx.createLinearGradient(x - 30, 0, x + 30, 0);
  stone.addColorStop(0, '#d9dde8');
  stone.addColorStop(1, '#9ea6b8');
  const tower = (cx, top, width, height) => {
    ctx.fillStyle = stone;
    ctx.fillRect(cx - width / 2, top, width, height);
    for (let i = 0; i < 3; i += 1) ctx.fillRect(cx - width / 2 + i * (width / 2.5), top - 5, width / 5, 6);
  };
  tower(x - 24, y - 22, 16, 38);
  tower(x + 24, y - 22, 16, 38);
  tower(x, y - 14, 36, 30);
  ctx.fillStyle = '#e2584d';
  [[x - 24, y - 27, 12], [x + 24, y - 27, 12]].forEach(([cx, top, half]) => {
    ctx.beginPath();
    ctx.moveTo(cx - half, top);
    ctx.lineTo(cx, top - 20);
    ctx.lineTo(cx + half, top);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 16);
  ctx.lineTo(x - 8, y + 2);
  ctx.quadraticCurveTo(x, y - 8, x + 8, y + 2);
  ctx.lineTo(x + 8, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 19);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 14, y - 35);
  ctx.lineTo(x, y - 30);
  ctx.closePath();
  ctx.fill();
};

const drawPedestal = (ctx, slot) => {
  ctx.fillStyle = 'rgba(20, 60, 30, 0.35)';
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y + 8, 23, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7f8798';
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y + 5, 20, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(slot.x - 20, slot.y, 40, 5);
  const top = ctx.createLinearGradient(0, slot.y - 8, 0, slot.y + 8);
  top.addColorStop(0, '#e6eaf2');
  top.addColorStop(1, '#b4bccb');
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y, 20, 8, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y, 14, 5, 0, 0, TAU);
  ctx.stroke();
};

// `view`: { width, height, ratio, scale, ox, oy } em pixels de tela.
export const buildWorld = (view) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(view.width * view.ratio);
  canvas.height = Math.round(view.height * view.ratio);
  const ctx = canvas.getContext('2d');
  const k = view.ratio * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.ratio, view.oy * view.ratio);
  const bounds = { x: -view.ox / view.scale, y: -view.oy / view.scale, w: view.width / view.scale, h: view.height / view.scale };

  drawGround(ctx, bounds);
  drawFlowers(ctx);
  drawRoad(ctx);
  ROCKS.forEach(([x, y]) => drawRock(ctx, x, y));
  drawCave(ctx);
  SLOTS.forEach((slot) => drawPedestal(ctx, slot));
  drawCastle(ctx);
  TREES.forEach(([x, y]) => drawTree(ctx, x, y));
  return canvas;
};
