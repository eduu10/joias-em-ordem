// Monta um quadro inteiro do jogo a partir do estado. Nao altera nada.
import { CONFIG, PHASE } from './config.js';
import { canMove, isJarDone } from './puzzle.js';
import { clamp01, easeInCubic, easeInOutQuad, easeOutBack, easeOutCubic, lerp } from './ease.js';
import { hoverCenter, slotCenter } from './layout.js';
import { drawBackground } from './background.js';
import { drawJarBack, drawJarFront } from './jars.js';
import { drawGem } from './sprites.js';
import { drawParticles } from './effects.js';
import { drawButtons, drawCaption, drawHud, drawPanel, drawToast } from './ui.js';
import { drawText } from './draw.js';

const FLIGHT_CROSS = 0.6;
const INTRO_STAGGER = 0.035;
const INTRO_EACH = 0.32;

export const flightPosition = (flight) => {
  const { t } = flight;
  const cross = clamp01(t / FLIGHT_CROSS);
  const x = lerp(flight.from.x, flight.hover.x, easeInOutQuad(cross));
  const y = t < FLIGHT_CROSS
    ? lerp(flight.from.y, flight.hover.y, easeOutCubic(cross))
    : lerp(flight.hover.y, flight.to.y, easeInCubic((t - FLIGHT_CROSS) / (1 - FLIGHT_CROSS)));
  return { x, y };
};

const bounceSquash = (bounce, jarIndex) => {
  if (!bounce || bounce.jar !== jarIndex) return 0;
  return Math.sin(Math.PI * bounce.t) * (1 - bounce.t);
};

const drawHintArrow = (ctx, layout, hint, time) => {
  const from = hoverCenter(layout.jars[hint.from], layout.gem);
  const to = hoverCenter(layout.jars[hint.to], layout.gem);
  const peakY = Math.min(from.y, to.y) - layout.gem * 0.9;
  const midX = (from.x + to.x) / 2;
  const fade = Math.min(1, hint.t * 5, (CONFIG.hintSeconds - hint.t) * 3);
  ctx.save();
  ctx.globalAlpha = clamp01(fade);
  ctx.strokeStyle = '#78ffd6';
  ctx.lineWidth = Math.max(3, layout.gem * 0.1);
  ctx.lineCap = 'round';
  ctx.setLineDash([layout.gem * 0.22, layout.gem * 0.2]);
  ctx.lineDashOffset = -time * layout.gem * 1.6;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(midX, peakY, to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const size = layout.gem * 0.26;
  const dx = to.x - midX;
  const dy = to.y - peakY;
  const length = Math.hypot(dx, dy) || 1;
  ctx.fillStyle = '#78ffd6';
  ctx.beginPath();
  ctx.moveTo(to.x + (dx / length) * size, to.y + (dy / length) * size);
  ctx.lineTo(to.x - (dy / length) * size, to.y + (dx / length) * size);
  ctx.lineTo(to.x + (dy / length) * size, to.y - (dx / length) * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawJars = (ctx, frame) => {
  const { session, layout, view, fx } = frame;
  const { gem } = layout;
  const pulse = 0.5 + 0.5 * Math.sin(fx.time * 6);
  const lifted = [];

  session.jars.forEach((jar, index) => {
    const box = layout.jars[index];
    const appear = clamp01((fx.introT - index * INTRO_STAGGER) / INTRO_EACH);
    if (appear <= 0) return;
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.translate(0, (1 - easeOutBack(appear)) * gem * 0.9);

    drawJarBack(ctx, box, gem);
    const landing = fx.flight && fx.flight.toJar === index;
    jar.forEach((color, slot) => {
      const isTop = slot === jar.length - 1;
      if (isTop && landing) return;
      const rest = slotCenter(box, slot, gem);
      if (isTop && session.selected === index) {
        const hover = hoverCenter(box, gem);
        const rise = easeOutBack(clamp01(fx.liftT));
        lifted.push({ color, x: rest.x, y: lerp(rest.y, hover.y, rise) + Math.sin(fx.time * 5) * gem * 0.04 });
        return;
      }
      drawGem(ctx, color, rest.x, rest.y, gem, view.ratio, isTop ? bounceSquash(fx.bounce, index) : 0);
    });
    const selecting = session.selected !== null && session.selected !== index;
    drawJarFront(ctx, box, gem, {
      done: isJarDone(jar, session.capacity),
      target: selecting && canMove(session.jars, session.selected, index, session.capacity),
      hint: Boolean(fx.hint) && (fx.hint.from === index || fx.hint.to === index),
      pulse,
    });
    ctx.restore();
  });

  lifted.forEach((item) => drawGem(ctx, item.color, item.x, item.y, gem, view.ratio));
  if (fx.hint) drawHintArrow(ctx, layout, fx.hint, fx.time);
  if (fx.flight) {
    const position = flightPosition(fx.flight);
    drawGem(ctx, fx.flight.color, position.x, position.y, gem, view.ratio);
  }
};

const captionFor = (frame) => {
  const { session, strings, stuck } = frame;
  if (session.phase !== PHASE.PLAYING) return '';
  if (stuck) return strings.noMoves;
  if (session.level === 1) return session.moves === 0 ? strings.tutorial : strings.goal;
  return '';
};

export const drawLoading = (ctx, view, strings) => {
  drawBackground(ctx, view, 0);
  const size = Math.min(view.width, view.height) * 0.05;
  drawText(ctx, strings.loading, view.width / 2, view.height / 2, size, { color: '#e3d8ff' });
};

// `frame`: { session, layout, view, fx, strings, hints, stuck, offerT }
export const drawScene = (ctx, frame) => {
  const { session, layout, view, fx, strings } = frame;
  const playing = session.phase === PHASE.PLAYING;
  drawBackground(ctx, view, fx.time);
  drawHud(ctx, view, session, strings);
  drawJars(ctx, frame);
  drawCaption(ctx, view, captionFor(frame));
  drawButtons(ctx, layout.buttons, {
    undo: { enabled: playing && session.history.length > 0, flash: fx.undoFlash, badge: null },
    restart: { enabled: playing && session.moves > 0, flash: 0, badge: null },
    hint: { enabled: playing, flash: 0, badge: frame.hints > 0 ? String(frame.hints) : '+' },
  });
  drawToast(ctx, view, fx.toast?.text, fx.toast ? clamp01(Math.min(fx.toast.t * 6, (CONFIG.toastSeconds - fx.toast.t) * 3)) : 0);
  drawParticles(ctx, fx.particles);

  if (!playing && fx.winT > CONFIG.winDelaySeconds) {
    drawPanel(ctx, view, { title: strings.levelDone, primary: strings.next, stars: true }, fx.winT - CONFIG.winDelaySeconds);
  }
  if (frame.offerT !== null) {
    drawPanel(ctx, view, {
      title: strings.offerTitle,
      body: strings.offerBody,
      primary: strings.offerAccept,
      secondary: strings.offerDecline,
      stars: false,
    }, frame.offerT);
  }
};
