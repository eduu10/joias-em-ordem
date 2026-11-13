// Potes de vidro. O fundo e desenhado antes das gemas e o contorno depois, para elas parecerem la dentro.
const GOLD = '255, 214, 102';
const WHITE = '255, 255, 255';
const HINT = '120, 255, 214';

const tubePath = (ctx, jar) => {
  const radius = jar.w / 2;
  ctx.beginPath();
  ctx.moveTo(jar.x, jar.y);
  ctx.lineTo(jar.x, jar.y + jar.h - radius);
  ctx.arc(jar.x + radius, jar.y + jar.h - radius, radius, Math.PI, 0, true);
  ctx.lineTo(jar.x + jar.w, jar.y);
};

export const drawJarBack = (ctx, jar, gem) => {
  ctx.fillStyle = 'rgba(8, 2, 30, 0.38)';
  ctx.beginPath();
  ctx.ellipse(jar.cx, jar.y + jar.h + gem * 0.1, jar.w * 0.56, gem * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  const glass = ctx.createLinearGradient(jar.x, 0, jar.x + jar.w, 0);
  glass.addColorStop(0, `rgba(${WHITE}, 0.2)`);
  glass.addColorStop(0.35, `rgba(${WHITE}, 0.06)`);
  glass.addColorStop(1, `rgba(${WHITE}, 0.16)`);
  tubePath(ctx, jar);
  ctx.closePath();
  ctx.fillStyle = glass;
  ctx.fill();
};

// `state`: { done, target, hint, pulse } onde pulse vai de 0 a 1.
export const drawJarFront = (ctx, jar, gem, state) => {
  const tint = state.done ? GOLD : state.hint ? HINT : WHITE;
  const strong = state.done || state.hint || state.target;
  const line = Math.max(2, gem * 0.07);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (strong) {
    ctx.shadowColor = `rgba(${tint}, ${0.55 + state.pulse * 0.35})`;
    ctx.shadowBlur = gem * (0.35 + state.pulse * 0.3);
  }
  tubePath(ctx, jar);
  ctx.strokeStyle = `rgba(${tint}, ${strong ? 0.95 : 0.62})`;
  ctx.lineWidth = line;
  ctx.stroke();
  ctx.restore();

  // Reflexo vertical do vidro.
  ctx.strokeStyle = `rgba(${WHITE}, 0.28)`;
  ctx.lineWidth = jar.w * 0.07;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(jar.x + jar.w * 0.2, jar.y + jar.h * 0.1);
  ctx.lineTo(jar.x + jar.w * 0.2, jar.y + jar.h * 0.62);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(jar.x + jar.w * 0.2, jar.y + jar.h * 0.7);
  ctx.lineTo(jar.x + jar.w * 0.2, jar.y + jar.h * 0.74);
  ctx.stroke();

  // Borda da boca do pote.
  const rimH = Math.max(4, gem * 0.14);
  const rimW = jar.w * 1.16;
  ctx.fillStyle = `rgba(${tint}, ${strong ? 0.95 : 0.78})`;
  ctx.beginPath();
  ctx.ellipse(jar.cx, jar.y, rimW / 2, rimH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40, 16, 90, 0.55)';
  ctx.beginPath();
  ctx.ellipse(jar.cx, jar.y, rimW / 2 - line, Math.max(1, rimH / 2 - line * 0.55), 0, 0, Math.PI * 2);
  ctx.fill();
};
