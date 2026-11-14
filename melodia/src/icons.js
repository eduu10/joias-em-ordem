// Desenhos pequenos: o simbolo de cada categoria, alto-falante, seta de voltar, tela de anuncio.
import { CATEGORY } from './config.js';
import { roundRectPath } from './draw.js';
import { drawNoteGlyph } from './stage.js';

const TAU = Math.PI * 2;

export const CATEGORY_HUE = Object.freeze({
  [CATEGORY.CLASSICAL]: 40,
  [CATEGORY.STAGE]: 342,
  [CATEGORY.FOLK]: 138,
  [CATEGORY.CANTIGAS]: 196,
  [CATEGORY.MIX]: 280,
});

// Teclas de piano
const drawKeys = (ctx, s) => {
  roundRectPath(ctx, -s, -s * 0.62, s * 2, s * 1.24, s * 0.14);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 20, 0, 0.35)';
  ctx.lineWidth = s * 0.04;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-s + i * s * 0.4, -s * 0.62);
    ctx.lineTo(-s + i * s * 0.4, s * 0.62);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1608';
  [1, 2, 4].forEach((i) => ctx.fillRect(-s + i * s * 0.4 - s * 0.12, -s * 0.62, s * 0.24, s * 0.74));
};

// Cortinas de teatro com uma estrela
const drawCurtains = (ctx, s) => {
  ctx.fillStyle = '#ffe9c2';
  ctx.fillRect(-s * 0.9, -s * 0.7, s * 1.8, s * 1.4);
  ctx.fillStyle = '#b3123f';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * s, -s * 0.8);
    ctx.lineTo(side * s * 0.1, -s * 0.8);
    ctx.quadraticCurveTo(side * s * 0.2, s * 0.1, side * s * 0.62, s * 0.8);
    ctx.lineTo(side * s, s * 0.8);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = '#ffd24a';
  ctx.fillRect(-s * 1.05, -s * 0.92, s * 2.1, s * 0.2);
  ctx.beginPath();
  for (let p = 0; p < 10; p += 1) {
    const r = p % 2 ? s * 0.14 : s * 0.32;
    const a = (p * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, s * 0.2 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
};

// Violao
const drawGuitar = (ctx, s) => {
  ctx.rotate(-0.6);
  ctx.fillStyle = '#6b3a12';
  ctx.fillRect(-s * 0.09, -s * 1.15, s * 0.18, s * 1.1);
  ctx.fillStyle = '#3d2008';
  ctx.fillRect(-s * 0.15, -s * 1.3, s * 0.3, s * 0.24);
  ctx.fillStyle = '#f0a23c';
  ctx.beginPath();
  ctx.arc(0, s * 0.48, s * 0.54, 0, TAU);
  ctx.arc(0, -s * 0.06, s * 0.38, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3d2008';
  ctx.beginPath();
  ctx.arc(0, s * 0.3, s * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillRect(-s * 0.2, s * 0.66, s * 0.4, s * 0.08);
};

// Balao de festa junina
const drawBalloon = (ctx, s) => {
  const stripes = ['#ffd24a', '#ff6b6b', '#3df5e0', '#ff6b6b', '#ffd24a'];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 1.05, -s * 0.9, s * 0.9, s * 0.25, s * 0.26, s * 0.62);
  ctx.lineTo(-s * 0.26, s * 0.62);
  ctx.bezierCurveTo(-s * 0.9, s * 0.25, -s * 1.05, -s * 0.9, 0, -s);
  ctx.closePath();
  ctx.clip();
  stripes.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(-s + i * s * 0.4, -s, s * 0.4, s * 1.7);
  });
  ctx.restore();
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, s * 0.98);
  ctx.quadraticCurveTo(0, s * 0.5, s * 0.16, s * 0.98);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b3a12';
  ctx.fillRect(-s * 0.26, s * 0.62, s * 0.52, s * 0.1);
};

// Notas de varias cores (tudo misturado)
const drawMixed = (ctx, s) => {
  drawNoteGlyph(ctx, -s * 0.75, s * 0.1, s * 0.62, '#ffd24a');
  drawNoteGlyph(ctx, s * 0.05, -s * 0.2, s * 0.72, '#3df5e0', true);
  drawNoteGlyph(ctx, s * 0.95, s * 0.2, s * 0.56, '#ff7ad1');
};

const CATEGORY_ICON = Object.freeze({
  [CATEGORY.CLASSICAL]: drawKeys,
  [CATEGORY.STAGE]: drawCurtains,
  [CATEGORY.FOLK]: drawGuitar,
  [CATEGORY.CANTIGAS]: drawBalloon,
  [CATEGORY.MIX]: drawMixed,
});

export const drawCategoryIcon = (ctx, category, x, y, size) => {
  ctx.save();
  ctx.translate(x, y);
  CATEGORY_ICON[category](ctx, size);
  ctx.restore();
};

// Alto-falante; com `muted` ganha um risco vermelho.
export const drawSpeaker = (ctx, x, y, size, muted, time = 0) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-size * 0.9, -size * 0.3);
  ctx.lineTo(-size * 0.45, -size * 0.3);
  ctx.lineTo(size * 0.05, -size * 0.75);
  ctx.lineTo(size * 0.05, size * 0.75);
  ctx.lineTo(-size * 0.45, size * 0.3);
  ctx.lineTo(-size * 0.9, size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.13;
  if (muted) {
    ctx.strokeStyle = '#ff5c7a';
    ctx.lineWidth = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(size * 0.35, -size * 0.4);
    ctx.lineTo(size * 1.05, size * 0.4);
    ctx.moveTo(size * 1.05, -size * 0.4);
    ctx.lineTo(size * 0.35, size * 0.4);
    ctx.stroke();
  } else {
    [0.45, 0.8].forEach((r, i) => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 + 0.45 * Math.sin(time * 5 - i * 1.4)})`;
      ctx.beginPath();
      ctx.arc(size * 0.1, 0, size * r, -0.8, 0.8);
      ctx.stroke();
    });
  }
  ctx.restore();
};

export const drawBackArrow = (ctx, x, y, size, color = '#ffffff') => {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.4, y - size * 0.6);
  ctx.lineTo(x - size * 0.3, y);
  ctx.lineTo(x + size * 0.4, y + size * 0.6);
  ctx.stroke();
};
