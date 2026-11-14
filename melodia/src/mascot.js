// Avatares: o jogador (carinha com fone de ouvido) e o rival, um robozinho que deixa claro que e o computador.
import { roundRectPath } from './draw.js';
import { drawNoteGlyph } from './stage.js';

const TAU = Math.PI * 2;
export const MOOD = Object.freeze({ IDLE: 'idle', THINK: 'think', HAPPY: 'happy', SAD: 'sad' });

const blinking = (time, offset) => (time + offset) % 3.4 < 0.12;

const drawMouth = (ctx, mood, y, width) => {
  ctx.lineWidth = width * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === MOOD.HAPPY) ctx.arc(0, y - width * 0.25, width * 0.55, 0.25, Math.PI - 0.25);
  else if (mood === MOOD.SAD) ctx.arc(0, y + width * 0.55, width * 0.5, Math.PI + 0.45, TAU - 0.45);
  else if (mood === MOOD.THINK) ctx.arc(width * 0.1, y + width * 0.05, width * 0.16, 0, TAU);
  else ctx.arc(0, y - width * 0.1, width * 0.4, 0.4, Math.PI - 0.4);
  ctx.stroke();
};

// Moldura comprada na lojinha (ou a padrao) em volta do avatar do jogador.
export const drawFrame = (ctx, x, y, radius, frameId, time) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = radius * 0.13;
  if (frameId === 'frame-gold') {
    const gold = ctx.createLinearGradient(-radius, -radius, radius, radius);
    gold.addColorStop(0, '#fff3b0');
    gold.addColorStop(0.5, '#ffb62e');
    gold.addColorStop(1, '#fff3b0');
    ctx.strokeStyle = gold;
    ctx.lineWidth = radius * 0.2;
  } else if (frameId === 'frame-neon') {
    ctx.shadowColor = '#3df5e0';
    ctx.shadowBlur = radius * (0.4 + 0.2 * Math.sin(time * 5));
    ctx.strokeStyle = '#3df5e0';
  } else if (frameId === 'frame-star') {
    ctx.strokeStyle = '#ff7ad1';
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = radius * 0.09;
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (frameId === 'frame-star') {
    for (let i = 0; i < 6; i += 1) {
      const angle = time * 0.8 + (i * TAU) / 6;
      const size = radius * (0.16 + 0.04 * Math.sin(time * 4 + i));
      ctx.fillStyle = i % 2 ? '#ffe066' : '#ffffff';
      ctx.beginPath();
      for (let p = 0; p < 10; p += 1) {
        const r = p % 2 ? size * 0.45 : size;
        const a = (p * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(angle) * radius + Math.cos(a) * r, Math.sin(angle) * radius + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
};

export const drawPlayer = (ctx, x, y, radius, options = {}) => {
  const { mood = MOOD.IDLE, time = 0, frameId = null } = options;
  ctx.save();
  ctx.translate(x, y);
  const back = ctx.createLinearGradient(0, -radius, 0, radius);
  back.addColorStop(0, '#ff8a5c');
  back.addColorStop(1, '#d6336c');
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  // Rosto
  const face = radius * 0.58;
  ctx.fillStyle = '#ffe2a8';
  ctx.beginPath();
  ctx.arc(0, radius * 0.08, face, 0, TAU);
  ctx.fill();
  // Fone de ouvido
  ctx.strokeStyle = '#2b1657';
  ctx.lineWidth = radius * 0.14;
  ctx.beginPath();
  ctx.arc(0, radius * 0.04, face * 1.08, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.fillStyle = '#3df5e0';
  [-1, 1].forEach((side) => {
    roundRectPath(ctx, side * face * 1.02 - radius * 0.13, -radius * 0.12, radius * 0.26, radius * 0.46, radius * 0.1);
    ctx.fill();
  });
  // Olhos e boca
  ctx.fillStyle = '#2b1657';
  ctx.strokeStyle = '#2b1657';
  const closed = blinking(time, 0.6) || mood === MOOD.HAPPY;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    if (closed) ctx.ellipse(side * face * 0.38, radius * 0.02, radius * 0.1, radius * 0.03, 0, 0, TAU);
    else ctx.arc(side * face * 0.38, radius * 0.02, radius * 0.08, 0, TAU);
    ctx.fill();
  });
  drawMouth(ctx, mood, radius * 0.3, radius * 0.34);
  ctx.restore();
  drawFrame(ctx, x, y, radius, frameId, time);
};

// O rival: robo com antena de nota musical. `mood` muda os olhos e a boca.
export const drawRobot = (ctx, x, y, radius, options = {}) => {
  const { mood = MOOD.IDLE, time = 0 } = options;
  ctx.save();
  ctx.translate(x, y);
  const back = ctx.createLinearGradient(0, -radius, 0, radius);
  back.addColorStop(0, '#3b2a8c');
  back.addColorStop(1, '#1d1450');
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.clip();
  // Antena
  const wobble = Math.sin(time * 4) * radius * 0.05;
  ctx.strokeStyle = '#b9c4e8';
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.42);
  ctx.lineTo(wobble, -radius * 0.74);
  ctx.stroke();
  ctx.fillStyle = mood === MOOD.THINK ? '#ffe066' : '#ff7ad1';
  ctx.beginPath();
  ctx.arc(wobble, -radius * 0.78, radius * 0.11, 0, TAU);
  ctx.fill();
  // Cabeca
  const w = radius * 1.2;
  const h = radius * 0.92;
  const head = ctx.createLinearGradient(0, -h / 2, 0, h / 2 + radius * 0.1);
  head.addColorStop(0, '#e6ecff');
  head.addColorStop(1, '#93a3d6');
  ctx.fillStyle = '#6f7fb8';
  [-1, 1].forEach((side) => {
    roundRectPath(ctx, side * (w / 2 + radius * 0.02) - radius * 0.09, -radius * 0.08, radius * 0.18, radius * 0.34, radius * 0.06);
    ctx.fill();
  });
  roundRectPath(ctx, -w / 2, -radius * 0.42, w, h, radius * 0.26);
  ctx.fillStyle = head;
  ctx.fill();
  // Visor com olhos de LED
  roundRectPath(ctx, -w * 0.39, -radius * 0.27, w * 0.78, radius * 0.4, radius * 0.14);
  ctx.fillStyle = '#16103a';
  ctx.fill();
  const led = mood === MOOD.SAD ? '#ff6b7d' : '#3df5e0';
  ctx.fillStyle = led;
  ctx.strokeStyle = led;
  const shut = blinking(time, 1.9);
  [-1, 1].forEach((side) => {
    const ex = side * w * 0.2 + (mood === MOOD.THINK ? Math.sin(time * 3) * radius * 0.05 : 0);
    ctx.beginPath();
    if (mood === MOOD.HAPPY) {
      ctx.lineWidth = radius * 0.07;
      ctx.arc(ex, -radius * 0.03, radius * 0.09, Math.PI, TAU);
      ctx.stroke();
    } else {
      ctx.ellipse(ex, -radius * 0.07, radius * 0.08, shut ? radius * 0.015 : radius * 0.1, 0, 0, TAU);
      ctx.fill();
    }
  });
  ctx.strokeStyle = '#3b2a8c';
  drawMouth(ctx, mood, radius * 0.3, radius * 0.26);
  ctx.restore();
  ctx.strokeStyle = '#8fa2ff';
  ctx.lineWidth = radius * 0.09;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  ctx.restore();
  if (mood === MOOD.THINK) drawNoteGlyph(ctx, x + radius * 0.95, y - radius * 0.75 + Math.sin(time * 5) * 2, radius * 0.3, '#ffe066');
};
