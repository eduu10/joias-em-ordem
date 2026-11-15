// Interface no espaco de 360 x 640: botoes, titulo, garagem, pistas e medidor de forca. So desenha.
import { DESIGN } from './config.js';
import { drawText, fitText, roundRectPath } from './draw.js';
import { easeOutBack, clamp01 } from './ease.js';

export const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const rect = (x, y, w, h) => Object.freeze({ x, y, w, h });

export const UI = Object.freeze({
  prev: rect(8, 200, 46, 70),
  next: rect(306, 200, 46, 70),
  action: rect(50, 452, 260, 50),
  go: rect(50, 516, 260, 54),
  back: rect(16, 580, 110, 40),
  cards: Object.freeze([0, 1, 2, 3, 4, 5].map((i) => rect(i % 2 ? 186 : 14, 86 + Math.floor(i / 2) * 156, 160, 144))),
  replay: rect(28, 446, 146, 46),
  double: rect(186, 446, 146, 46),
  again: rect(28, 504, 146, 52),
  garage: rect(186, 504, 146, 52),
});

export const drawButton = (ctx, r, label, options = {}) => {
  const { color = '#ff5a1f', enabled = true, pulse = 0, small = false } = options;
  const lift = pulse ? Math.sin(pulse) * 2 : 0;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRectPath(ctx, r.x, r.y + 4, r.w, r.h, 14);
  ctx.fill();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, enabled ? color : '#9aa0a8');
  g.addColorStop(1, enabled ? shade(color) : '#6f757c');
  ctx.fillStyle = g;
  roundRectPath(ctx, r.x, r.y - lift, r.w, r.h, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  roundRectPath(ctx, r.x + 4, r.y - lift + 3, r.w - 8, r.h * 0.38, 10);
  ctx.fill();
  const size = fitText(ctx, label, r.w - 18, small ? 14 : 18);
  drawText(ctx, label, r.x + r.w / 2, r.y + r.h / 2 - lift + 1, size);
};

const shade = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * 0.62).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

export const drawPanel = (ctx, x, y, w, h, alpha = 0.92) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  roundRectPath(ctx, x, y + 6, w, h, 20);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.fill();
};

export const drawCoins = (ctx, coins, pop = 0) => {
  const text = `${coins}`;
  ctx.font = '800 16px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 46;
  const x = DESIGN.w - w - 12;
  ctx.fillStyle = 'rgba(20, 30, 50, 0.6)';
  roundRectPath(ctx, x, 12, w, 32, 16);
  ctx.fill();
  const r = 10 * (1 + pop * 0.3);
  ctx.fillStyle = '#ffc928';
  ctx.beginPath();
  ctx.arc(x + 18, 28, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c98a00';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, text, x + 34, 28, 16, { align: 'left' });
};

export const drawHeader = (ctx, text) => drawText(ctx, text, 20, 28, 24, { align: 'left', weight: 900 });

export const drawTitle = (ctx, strings, time, best) => {
  const t = clamp01(time / 0.9);
  const s = easeOutBack(t);
  ctx.save();
  ctx.translate(DESIGN.w / 2, 170);
  ctx.rotate(-0.08);
  ctx.scale(s, s);
  // Faixa de alerta original atras do logo.
  ctx.fillStyle = '#141414';
  roundRectPath(ctx, -165, -70, 330, 140, 18);
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, -165, -70, 330, 140, 18);
  ctx.clip();
  ctx.fillStyle = '#ffd21f';
  for (let i = -12; i < 12; i += 1) {
    ctx.beginPath();
    const x = i * 30 + ((time * 40) % 30);
    ctx.moveTo(x, -70);
    ctx.lineTo(x + 15, -70);
    ctx.lineTo(x - 25, 70);
    ctx.lineTo(x - 40, 70);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(20, 20, 20, 0.86)';
  ctx.fillRect(-150, -58, 300, 116);
  ctx.restore();
  const wobble = Math.sin(time * 9) * Math.max(0, 1 - (time % 3) * 2) * 4;
  drawText(ctx, strings.title, wobble, -18, 62, { color: '#ffffff', weight: 900 });
  drawText(ctx, strings.subtitle, -wobble, 34, 46, { color: '#ff5a1f', weight: 900 });
  ctx.restore();
  drawText(ctx, strings.tagline, DESIGN.w / 2, 268, 15, { color: '#1b2b44', weight: 700, shadow: false });
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.globalAlpha = pulse;
  drawText(ctx, strings.tapToStart, DESIGN.w / 2, 560, 22);
  ctx.globalAlpha = 1;
  if (best > 0) drawText(ctx, `${strings.best}: ${best}`, DESIGN.w / 2, 600, 14, { color: '#fff7c2' });
};

const statBar = (ctx, y, label, value) => {
  drawText(ctx, label, 40, y, 13, { align: 'left', color: '#33415c', shadow: false, weight: 700 });
  ctx.fillStyle = '#d9dee6';
  roundRectPath(ctx, 130, y - 6, 190, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ff7a1f';
  roundRectPath(ctx, 130, y - 6, Math.max(12, 190 * clamp01(value)), 12, 6);
  ctx.fill();
};

// `info`: { name, stats: [massa, rigidez, tamanho] 0..1, owned, price, canBuy, canTry, tried, index, count }
export const drawGarage = (ctx, strings, info, coins, time) => {
  drawHeader(ctx, strings.garage);
  drawCoins(ctx, coins);
  drawText(ctx, info.name, DESIGN.w / 2, 96, 28, { weight: 900 });
  drawText(ctx, `${info.index + 1} / ${info.count}`, DESIGN.w / 2, 124, 12, { color: '#eaf4ff' });
  [['<', UI.prev], ['>', UI.next]].forEach(([label, r]) => drawButton(ctx, r, label, { color: '#3d7bd9' }));
  drawPanel(ctx, 24, 330, 312, 108, 0.9);
  statBar(ctx, 356, strings.mass, info.stats[0]);
  statBar(ctx, 384, strings.stiffness, info.stats[1]);
  statBar(ctx, 412, strings.size, info.stats[2]);
  if (info.owned) {
    drawText(ctx, info.trial ? strings.trial : strings.owned, DESIGN.w / 2, 477, 18, { color: '#d8ffd0' });
    drawButton(ctx, UI.go, strings.next, { pulse: time * 4 });
  } else {
    drawButton(ctx, UI.action, `${strings.buy}  ${info.price}`, { color: '#2fb35a', enabled: info.canBuy });
    if (info.canTry) drawButton(ctx, UI.go, strings.freeTry, { color: '#7a4dff', small: true });
    else drawText(ctx, strings.tried, DESIGN.w / 2, 543, 13, { color: '#eef' });
  }
};

// `cards`: [{ name, best, price, owned, canBuy, selected, draw(ctx, x, y, w, h) }]
export const drawTracks = (ctx, strings, cards, coins) => {
  drawHeader(ctx, strings.tracks);
  drawCoins(ctx, coins);
  cards.forEach((card, i) => {
    const r = UI.cards[i];
    drawPanel(ctx, r.x, r.y, r.w, r.h, card.owned ? 0.93 : 0.7);
    if (card.selected) {
      ctx.strokeStyle = '#ff5a1f';
      ctx.lineWidth = 3;
      roundRectPath(ctx, r.x, r.y, r.w, r.h, 20);
      ctx.stroke();
    }
    card.draw(ctx, r.x + 10, r.y + 10, r.w - 20, 70);
    const size = fitText(ctx, card.name, r.w - 16, 15);
    drawText(ctx, card.name, r.x + r.w / 2, r.y + 98, size, { color: '#1b2b44', shadow: false });
    const sub = card.owned ? `${strings.best}: ${card.best}` : `${strings.buy} ${card.price}`;
    drawText(ctx, sub, r.x + r.w / 2, r.y + 122, 13, {
      color: card.owned ? '#5a6780' : card.canBuy ? '#1d9a48' : '#a03030', shadow: false, weight: 700,
    });
  });
  drawButton(ctx, UI.back, strings.back, { color: '#3d7bd9', small: true });
};

export const meterValue = (time, hz) => 0.5 - 0.5 * Math.cos(time * hz * Math.PI * 2);

export const drawAim = (ctx, strings, value, kmh, label) => {
  drawText(ctx, label, DESIGN.w / 2, 70, 16, { color: '#ffffff' });
  drawPanel(ctx, 20, 440, 320, 150, 0.88);
  drawText(ctx, `${kmh}`, DESIGN.w / 2 - 10, 482, 44, { color: '#ff5a1f', weight: 900, shadow: false });
  drawText(ctx, strings.speed, DESIGN.w / 2 + 62, 492, 16, { color: '#33415c', shadow: false });
  const x = 40;
  const w = 280;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#3ccf5a');
  g.addColorStop(0.55, '#ffd21f');
  g.addColorStop(1, '#ff2d2d');
  ctx.fillStyle = g;
  roundRectPath(ctx, x, 518, w, 22, 11);
  ctx.fill();
  const nx = x + w * value;
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.moveTo(nx, 514);
  ctx.lineTo(nx - 9, 500);
  ctx.lineTo(nx + 9, 500);
  ctx.fill();
  ctx.fillRect(nx - 2, 514, 4, 30);
  drawText(ctx, strings.tapToLaunch, DESIGN.w / 2, 568, 14, { color: '#33415c', shadow: false, weight: 700 });
};

export const drawRunHud = (ctx, strings, kmh, banner) => {
  ctx.fillStyle = 'rgba(15, 20, 30, 0.55)';
  roundRectPath(ctx, 12, 12, 118, 46, 14);
  ctx.fill();
  drawText(ctx, `${kmh}`, 58, 36, 26, { weight: 900 });
  drawText(ctx, strings.speed, 106, 40, 12, { color: '#cfe0ff' });
  if (!banner) return;
  const t = clamp01(banner.t / 0.25);
  ctx.save();
  ctx.translate(DESIGN.w / 2, 150);
  ctx.rotate(-0.1);
  ctx.scale(easeOutBack(t), easeOutBack(t));
  ctx.globalAlpha = clamp01((1.6 - banner.t) * 2);
  drawText(ctx, banner.text, 0, 0, 46, { color: banner.color, weight: 900 });
  ctx.restore();
  ctx.globalAlpha = 1;
};

export const drawToast = (ctx, toast) => {
  if (!toast) return;
  ctx.globalAlpha = clamp01(Math.min(toast.t * 6, (2 - toast.t) * 3));
  ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
  roundRectPath(ctx, 40, 60, 280, 40, 14);
  ctx.fill();
  drawText(ctx, toast.text, DESIGN.w / 2, 80, 15);
  ctx.globalAlpha = 1;
};
