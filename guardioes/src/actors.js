// Personagens: guardioes (magos), monstros e os disparos de magia.
import { drawText } from './draw.js';

const TAU = Math.PI * 2;
const TIER_HUES = Object.freeze([205, 145, 48, 22, 330, 275, 180, 0, 52]);
const SKIN = '#ffd9b3';
const GOLD = '#ffd23f';

export const tierHue = (tier) => TIER_HUES[(tier - 1) % TIER_HUES.length];
const tint = (tier, light, alpha = 1) => `hsl(${tierHue(tier)} 82% ${light}% / ${alpha})`;

const drawAura = (ctx, tier, time) => {
  const pulse = 0.5 + 0.5 * Math.sin(time * 3 + tier);
  const glow = ctx.createRadialGradient(0, -14, 2, 0, -14, 30 + pulse * 4);
  glow.addColorStop(0, tint(tier, 70, 0.4));
  glow.addColorStop(1, tint(tier, 70, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -14, 34, 0, TAU);
  ctx.fill();
};

const drawHat = (ctx, tier) => {
  if (tier >= 7) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-9, -37);
    ctx.lineTo(-9, -47);
    ctx.lineTo(-4.5, -42);
    ctx.lineTo(0, -49);
    ctx.lineTo(4.5, -42);
    ctx.lineTo(9, -47);
    ctx.lineTo(9, -37);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tint(tier, 55);
    ctx.beginPath();
    ctx.arc(0, -41, 1.8, 0, TAU);
    ctx.fill();
    return;
  }
  ctx.fillStyle = tint(tier, 38);
  ctx.beginPath();
  ctx.ellipse(0, -37, 13, 3.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = tint(tier, 46);
  ctx.beginPath();
  ctx.moveTo(-8.5, -37);
  ctx.quadraticCurveTo(-3, -52, 6, -57);
  ctx.quadraticCurveTo(4, -46, 8.5, -37);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tier >= 4 ? GOLD : tint(tier, 68);
  ctx.fillRect(-8, -40.5, 16, 2.6);
};

const drawStaff = (ctx, tier, time) => {
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(13, -2);
  ctx.lineTo(15, -34);
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(time * 5 + tier);
  ctx.fillStyle = tint(tier, 72, 0.35);
  ctx.beginPath();
  ctx.arc(15, -37, 7 + pulse * 1.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = tint(tier, 62);
  ctx.beginPath();
  ctx.arc(15, -37, 4.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(13.8, -38.4, 1.4, 0, TAU);
  ctx.fill();
};

// `options`: { time, recoil (0 a 1), alpha, lifted }
export const drawHero = (ctx, x, y, tier, options = {}) => {
  const { time = 0, recoil = 0, alpha = 1, lifted = false } = options;
  const size = 1 + (tier - 1) * 0.045 + (lifted ? 0.12 : 0);
  const bob = Math.sin(time * 2.4 + x * 0.05) * 1.1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + bob - recoil * 2);
  ctx.scale(size, size * (1 - recoil * 0.06));

  if (tier >= 5) drawAura(ctx, tier, time);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, lifted ? 12 : 1, 12, 4, 0, 0, TAU);
  ctx.fill();

  // Manto.
  const robe = ctx.createLinearGradient(0, -24, 0, 2);
  robe.addColorStop(0, tint(tier, 60));
  robe.addColorStop(1, tint(tier, 40));
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-12, 1);
  ctx.quadraticCurveTo(-11, -22, 0, -24);
  ctx.quadraticCurveTo(11, -22, 12, 1);
  ctx.quadraticCurveTo(0, 5, -12, 1);
  ctx.fill();
  ctx.fillStyle = tier >= 4 ? GOLD : tint(tier, 76);
  ctx.fillRect(-1.3, -22, 2.6, 22);

  drawStaff(ctx, tier, time);

  // Cabeca.
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -29, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a2a4d';
  ctx.beginPath();
  ctx.arc(-3.2, -29.5, 1.4, 0, TAU);
  ctx.arc(3.2, -29.5, 1.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 120, 120, 0.5)';
  ctx.beginPath();
  ctx.arc(-5.6, -26.2, 1.7, 0, TAU);
  ctx.arc(5.6, -26.2, 1.7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3a2a4d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -27, 2.6, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  drawHat(ctx, tier);
  ctx.restore();

  // Selo com o nivel.
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#2b1a4f';
  ctx.beginPath();
  ctx.arc(x - 14, y + 2, 7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = tint(tier, 68);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  drawText(ctx, String(tier), x - 14, y + 2.4, 9, { shadow: false });
  ctx.restore();
};

const enemyHue = (enemy) => Math.max(-70, 115 - Math.log2(enemy.maxHp / 13 + 1) * 34);

export const drawEnemy = (ctx, enemy, x, y, time) => {
  const radius = enemy.boss ? 17 : 10.5;
  const wobble = Math.sin(time * 7 + enemy.id * 1.7);
  const hue = enemy.boss ? 285 : enemyHue(enemy);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.55, radius * 0.95, radius * 0.32, 0, 0, TAU);
  ctx.fill();

  ctx.scale(1 + wobble * 0.06, 1 - wobble * 0.06);
  if (enemy.boss) {
    ctx.fillStyle = '#f1e6c8';
    [[-1, 1], [1, 1]].forEach(([side]) => {
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.45, -radius * 0.75);
      ctx.lineTo(side * radius * 0.95, -radius * 1.5);
      ctx.lineTo(side * radius * 0.8, -radius * 0.5);
      ctx.closePath();
      ctx.fill();
    });
  }
  const body = ctx.createRadialGradient(-radius * 0.3, -radius * 0.5, 1, 0, 0, radius * 1.2);
  body.addColorStop(0, `hsl(${hue} 78% 68%)`);
  body.addColorStop(1, `hsl(${hue} 74% 40%)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-radius, radius * 0.5);
  ctx.bezierCurveTo(-radius * 1.1, -radius * 0.7, -radius * 0.5, -radius * 1.1, 0, -radius * 1.05);
  ctx.bezierCurveTo(radius * 0.5, -radius * 1.1, radius * 1.1, -radius * 0.7, radius, radius * 0.5);
  ctx.quadraticCurveTo(0, radius * 0.85, -radius, radius * 0.5);
  ctx.fill();
  ctx.strokeStyle = `hsl(${hue} 70% 26% / 0.7)`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-radius * 0.36, -radius * 0.28, radius * 0.27, 0, TAU);
  ctx.arc(radius * 0.36, -radius * 0.28, radius * 0.27, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1d1230';
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.24, radius * 0.13, 0, TAU);
  ctx.arc(radius * 0.42, -radius * 0.24, radius * 0.13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#1d1230';
  ctx.lineWidth = enemy.boss ? 2 : 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.68, -radius * 0.66);
  ctx.lineTo(-radius * 0.14, -radius * 0.5);
  ctx.moveTo(radius * 0.68, -radius * 0.66);
  ctx.lineTo(radius * 0.14, -radius * 0.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.45, -radius * 0.78, radius * 0.22, radius * 0.1, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();

  if (enemy.hp < enemy.maxHp) {
    const width = radius * 2.2;
    const top = y - radius * (enemy.boss ? 1.9 : 1.55);
    ctx.fillStyle = 'rgba(20, 10, 40, 0.7)';
    ctx.fillRect(x - width / 2 - 1, top - 1, width + 2, 5);
    ctx.fillStyle = enemy.boss ? '#c77dff' : '#ff5d5d';
    ctx.fillRect(x - width / 2, top, width * Math.max(0, enemy.hp / enemy.maxHp), 3);
  }
};

export const drawShot = (ctx, shot) => {
  const glow = ctx.createRadialGradient(shot.x, shot.y, 0, shot.x, shot.y, 8);
  glow.addColorStop(0, tint(shot.tier, 85, 0.95));
  glow.addColorStop(0.4, tint(shot.tier, 62, 0.7));
  glow.addColorStop(1, tint(shot.tier, 60, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, 8, 0, TAU);
  ctx.fill();
};

export const drawRange = (ctx, slot, range, tier) => {
  ctx.fillStyle = tint(tier, 70, 0.14);
  ctx.strokeStyle = tint(tier, 80, 0.7);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, range, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
};

export const drawSlotGlow = (ctx, slot, tier, pulse) => {
  ctx.strokeStyle = tint(tier, 78, 0.6 + pulse * 0.4);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(slot.x, slot.y, 23 + pulse * 3, 10 + pulse * 1.5, 0, 0, TAU);
  ctx.stroke();
};
