// Interface: placar no alto, botoes, cartoes (vitoria e oferta de anuncio) e avisos.
import { drawText, fitText, roundRectPath } from './draw.js';
import { clamp01, easeOutBack, easeOutCubic } from './ease.js';

const GOLD_TOP = '#ffe27a';
const GOLD_BOTTOM = '#ffb23e';
const INK = '#3b1a70';
const TAU = Math.PI * 2;

const arrowHead = (ctx, x, y, dx, dy, size) => {
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  ctx.beginPath();
  ctx.moveTo(x - ux * size - uy * size * 0.8, y - uy * size + ux * size * 0.8);
  ctx.lineTo(x, y);
  ctx.lineTo(x - ux * size + uy * size * 0.8, y - uy * size - ux * size * 0.8);
  ctx.stroke();
};

const ICONS = Object.freeze({
  undo(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, r * 0.08, r * 0.4, Math.PI * 1.05, Math.PI * 0.4);
    ctx.stroke();
    arrowHead(ctx, -r * 0.4, r * 0.06, 0, 1, r * 0.2);
  },
  restart(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, -Math.PI * 0.2, Math.PI * 1.35);
    ctx.stroke();
    const end = Math.PI * 1.35;
    arrowHead(ctx, Math.cos(end) * r * 0.4, Math.sin(end) * r * 0.4, -Math.sin(end), Math.cos(end), r * 0.2);
  },
  hint(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.3, Math.PI * 0.75, Math.PI * 0.25);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 0.36);
    ctx.lineTo(r * 0.12, r * 0.36);
    ctx.stroke();
  },
});

const drawBadge = (ctx, button, label) => {
  const x = button.x + button.r * 0.72;
  const y = button.y - button.r * 0.72;
  const radius = button.r * 0.42;
  const fill = ctx.createLinearGradient(0, y - radius, 0, y + radius);
  fill.addColorStop(0, GOLD_TOP);
  fill.addColorStop(1, GOLD_BOTTOM);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  drawText(ctx, label, x, y + radius * 0.06, radius * 1.15, { color: INK, shadow: false });
};

// `states[id]`: { enabled, flash (0 a 1), badge (texto ou null) }
export const drawButtons = (ctx, buttons, states) => {
  buttons.forEach((button) => {
    const state = states[button.id];
    ctx.save();
    ctx.globalAlpha = state.enabled ? 1 : 0.38;
    const fill = ctx.createLinearGradient(0, button.y - button.r, 0, button.y + button.r);
    fill.addColorStop(0, `rgba(255, 255, 255, ${0.26 + state.flash * 0.4})`);
    fill.addColorStop(1, `rgba(255, 255, 255, ${0.1 + state.flash * 0.3})`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(button.x, button.y, button.r * (1 + state.flash * 0.12), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(1.5, button.r * 0.06);
    ctx.stroke();

    ctx.translate(button.x, button.y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = button.r * 0.13;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ICONS[button.id](ctx, button.r);
    ctx.restore();
    if (state.badge) drawBadge(ctx, button, state.badge);
  });
};

export const drawHud = (ctx, view, session, strings) => {
  const { width: w, height: h } = view;
  const unit = Math.min(w, h * 0.62);
  const pillH = unit * 0.11;
  const pillW = unit * 0.46;
  const y = h * 0.075;
  const fill = ctx.createLinearGradient(0, y - pillH / 2, 0, y + pillH / 2);
  fill.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
  fill.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  roundRectPath(ctx, w / 2 - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawText(ctx, `${strings.level} ${session.level}`, w / 2, y + pillH * 0.03, pillH * 0.52);
  drawText(ctx, `${strings.moves}: ${session.moves}`, w / 2, y + pillH * 1.0, pillH * 0.32, { color: '#d6c8ff', weight: 600 });
};

export const drawCaption = (ctx, view, text, alpha = 1) => {
  if (!text || alpha <= 0) return;
  const unit = Math.min(view.width, view.height * 0.62);
  const size = fitText(ctx, text, view.width * 0.9, unit * 0.05, 700);
  ctx.globalAlpha = alpha;
  drawText(ctx, text, view.width / 2, view.height * 0.825, size, { color: '#efe6ff', weight: 700 });
  ctx.globalAlpha = 1;
};

export const drawToast = (ctx, view, text, alpha) => {
  if (!text || alpha <= 0) return;
  const unit = Math.min(view.width, view.height * 0.62);
  const size = fitText(ctx, text, view.width * 0.8, unit * 0.05, 700);
  ctx.font = `700 ${Math.round(size)}px system-ui, sans-serif`;
  const width = ctx.measureText(text).width + size * 1.8;
  const height = size * 2.1;
  const y = view.height * 0.168;
  ctx.globalAlpha = alpha;
  roundRectPath(ctx, view.width / 2 - width / 2, y - height / 2, width, height, height / 2);
  ctx.fillStyle = 'rgba(20, 8, 50, 0.82)';
  ctx.fill();
  drawText(ctx, text, view.width / 2, y, size, { weight: 700, shadow: false });
  ctx.globalAlpha = 1;
};

// Geometria dos cartoes. O desenho e o teste de toque usam a mesma conta.
export const panelLayout = (view) => {
  const w = Math.min(view.width * 0.86, view.height * 0.62, 440);
  const h = w * 0.82;
  const x = (view.width - w) / 2;
  const y = view.height * 0.46 - h / 2;
  const buttonW = w * 0.74;
  return {
    card: { x, y, w, h },
    primary: { x: x + (w - buttonW) / 2, y: y + h * 0.56, w: buttonW, h: h * 0.2 },
    secondary: { x: x + (w - buttonW) / 2, y: y + h * 0.79, w: buttonW, h: h * 0.14 },
  };
};

export const inRect = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

const drawStar = (ctx, x, y, radius) => {
  const fill = ctx.createLinearGradient(0, y - radius, 0, y + radius);
  fill.addColorStop(0, GOLD_TOP);
  fill.addColorStop(1, GOLD_BOTTOM);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 1 ? radius * 0.46 : radius;
    const angle = -Math.PI / 2 + (i * TAU) / 10;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(140, 70, 0, 0.45)';
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.lineJoin = 'round';
  ctx.stroke();
};

const drawPill = (ctx, rect, label, primary) => {
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.h / 2);
  if (primary) {
    const fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    fill.addColorStop(0, GOLD_TOP);
    fill.addColorStop(1, GOLD_BOTTOM);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const size = fitText(ctx, label, rect.w * 0.86, rect.h * (primary ? 0.46 : 0.58), primary ? 800 : 700);
  drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2, size, {
    color: primary ? INK : '#e3d8ff',
    weight: primary ? 800 : 700,
    shadow: false,
  });
};

// `content`: { title, body, primary, secondary, stars }; `t` em segundos desde que o cartao abriu.
export const drawPanel = (ctx, view, content, t) => {
  const open = clamp01(t / 0.32);
  const panel = panelLayout(view);
  const { card } = panel;

  ctx.fillStyle = `rgba(10, 3, 34, ${0.62 * easeOutCubic(open)})`;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.save();
  const scale = 0.7 + 0.3 * easeOutBack(open);
  ctx.translate(view.width / 2, card.y + card.h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-view.width / 2, -(card.y + card.h / 2));
  ctx.globalAlpha = easeOutCubic(open);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = card.w * 0.08;
  ctx.shadowOffsetY = card.w * 0.03;
  const fill = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  fill.addColorStop(0, '#8f4be0');
  fill.addColorStop(1, '#5a2bb5');
  roundRectPath(ctx, card.x, card.y, card.w, card.h, card.w * 0.08);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const centerX = card.x + card.w / 2;
  if (content.stars) {
    [-1, 0, 1].forEach((offset, index) => {
      const pop = easeOutBack(clamp01((t - 0.18 - index * 0.12) / 0.3));
      if (pop <= 0) return;
      const radius = card.w * (offset === 0 ? 0.105 : 0.08) * pop;
      drawStar(ctx, centerX + offset * card.w * 0.2, card.y + card.h * (offset === 0 ? 0.16 : 0.2), radius);
    });
  }
  const titleY = card.y + card.h * (content.stars ? 0.4 : 0.2);
  const titleSize = fitText(ctx, content.title, card.w * 0.86, card.w * 0.092);
  drawText(ctx, content.title, centerX, titleY, titleSize);
  if (content.body) {
    const bodySize = fitText(ctx, content.body, card.w * 0.86, card.w * 0.056, 600);
    drawText(ctx, content.body, centerX, card.y + card.h * 0.38, bodySize, { color: '#e9ddff', weight: 600 });
  }
  drawPill(ctx, panel.primary, content.primary, true);
  if (content.secondary) drawPill(ctx, panel.secondary, content.secondary, false);
  ctx.restore();
};
