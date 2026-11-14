// Ponto de entrada: liga regras, desenho, audio e o SDK do YouTube Playables.
import { CONFIG, PHASE, REWARD_ID_HINTS } from './config.js';
import { hasMoves } from './puzzle.js';
import { solve } from './solver.js';
import { generateLevel } from './levels.js';
import { EVENT, clearSelection, createSession, restart, tapJar, undo } from './session.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { buttonAt, computeLayout, hoverCenter, jarAt, slotCenter } from './layout.js';
import { clearSprites } from './sprites.js';
import { confettiRain, sparkleBurst, stepParticles } from './effects.js';
import { clamp01, easeOutBack, lerp } from './ease.js';
import { inRect, panelLayout } from './ui.js';
import { drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const FLASH_FADE_PER_SECOND = 1.6;
const EMPTY_FX = Object.freeze({
  liftT: 0, flight: null, bounce: null, hint: null, toast: null, winT: 0, introT: 0, undoFlash: 0,
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1 };
let progress = { level: 1, hints: CONFIG.startingHints };
let session = null;
let layout = null;
let stuck = false;
let offerT = null;
let busy = false;
let fx = { ...EMPTY_FX, time: 0, particles: [] };
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

const persist = () => platform.saveData(serializeSave(progress));
const toast = (text) => { fx = { ...fx, toast: { text, t: 0 } }; };

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  view = { width: Math.max(1, window.innerWidth), height: Math.max(1, window.innerHeight), ratio };
  canvas.width = Math.max(1, Math.round(view.width * ratio));
  canvas.height = Math.max(1, Math.round(view.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  clearSprites();
  if (!session) return;
  layout = computeLayout(view, session.jars.length, session.capacity);
  // As posicoes do voo sao em pixels da tela antiga: termina o voo em vez de voar torto.
  if (fx.flight) landFlight(fx.flight);
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted) drawFrame();
};

const drawFrame = () =>
  drawScene(ctx, { session, layout, view, fx, strings, hints: progress.hints, stuck, offerT });

const loadLevel = (level) => {
  const generated = generateLevel(level);
  session = createSession(level, generated.jars, generated.capacity);
  layout = computeLayout(view, session.jars.length, session.capacity);
  stuck = false;
  fx = { ...fx, ...EMPTY_FX, particles: [] };
};

const landFlight = (flight) => {
  const box = layout.jars[flight.toJar];
  const sparks = flight.jarDone ? sparkleBurst(box.cx, box.y + box.h / 2, flight.color, layout.gem) : [];
  const confetti = flight.won ? confettiRain(view) : [];
  audio.play(flight.won ? 'win' : flight.jarDone ? 'jar' : 'place');
  fx = { ...fx, flight: null, bounce: { jar: flight.toJar, t: 0 }, particles: [...fx.particles, ...sparks, ...confetti] };
};

const advance = (value, dt, seconds) => (value ? { ...value, t: value.t + dt / seconds } : null);
const expire = (value, limit) => (value && value.t < limit ? value : null);

const update = (dt) => {
  const flight = advance(fx.flight, dt, CONFIG.flightSeconds);
  fx = {
    ...fx,
    time: fx.time + dt,
    liftT: session.selected === null ? 0 : fx.liftT + dt / CONFIG.liftSeconds,
    flight,
    bounce: expire(advance(fx.bounce, dt, CONFIG.bounceSeconds), 1),
    hint: expire(advance(fx.hint, dt, 1), CONFIG.hintSeconds),
    toast: expire(advance(fx.toast, dt, 1), CONFIG.toastSeconds),
    introT: fx.introT + dt,
    undoFlash: Math.max(0, fx.undoFlash - dt * FLASH_FADE_PER_SECOND),
    winT: session.phase === PHASE.WON && !flight ? fx.winT + dt : 0,
    particles: stepParticles(fx.particles, dt),
  };
  if (flight && flight.t >= 1) landFlight(flight);
  if (offerT !== null) offerT += dt;
};

const frame = (time) => {
  if (!running) return;
  // Agenda o proximo quadro antes de tudo: um erro num quadro nao pode congelar o jogo.
  frameId = requestAnimationFrame(frame);
  // O relogio do quadro pode vir um pouco antes do ultimo tempo guardado: nunca deixar o tempo andar para tras.
  const dt = Math.max(0, Math.min(CONFIG.maxFrameSeconds, (time - lastTime) / 1000));
  lastTime = time;
  update(dt);
  drawFrame();
};

const startLoop = () => {
  if (running) return;
  running = true;
  lastTime = performance.now();
  frameId = requestAnimationFrame(frame);
};

const stopLoop = () => {
  running = false;
  cancelAnimationFrame(frameId);
};

const liftedPosition = (jarIndex, slot) => {
  const box = layout.jars[jarIndex];
  const rest = slotCenter(box, slot, layout.gem);
  return { x: rest.x, y: lerp(rest.y, hoverCenter(box, layout.gem).y, easeOutBack(clamp01(fx.liftT))) };
};

const startFlight = (event) => {
  const target = layout.jars[event.to];
  fx = {
    ...fx,
    hint: null,
    flight: {
      t: 0,
      color: event.color,
      toJar: event.to,
      from: liftedPosition(event.from, event.fromSlot),
      hover: hoverCenter(target, layout.gem),
      to: slotCenter(target, event.toSlot, layout.gem),
      jarDone: event.jarDone,
      won: event.won,
    },
  };
};

const handleJar = (index) => {
  const previousLift = fx.liftT;
  const result = tapJar(session, index);
  if (result.event.type === EVENT.MOVE) {
    startFlight(result.event);
    session = result.session;
    stuck = !result.event.won && !hasMoves(session.jars, session.capacity);
    if (result.event.won) {
      progress = { ...progress, level: session.level + 1 };
      persist();
      platform.sendScore(session.level);
    }
    return;
  }
  session = result.session;
  if (result.event.type === EVENT.SELECT) {
    fx = { ...fx, liftT: 0 };
    audio.play('pick');
  } else if (result.event.type === EVENT.DESELECT) {
    fx = { ...fx, liftT: previousLift };
    audio.play('back');
  }
};

const useHint = () => {
  if (fx.hint) return;
  if (progress.hints <= 0) {
    offerT = 0;
    return;
  }
  const path = solve(session.jars, session.capacity, CONFIG.solverNodeLimit);
  if (!path || path.length === 0) {
    toast(strings.tryUndo);
    fx = { ...fx, undoFlash: 1 };
    audio.play('deny');
    return;
  }
  progress = { ...progress, hints: progress.hints - 1 };
  session = clearSelection(session);
  fx = { ...fx, hint: { from: path[0].from, to: path[0].to, t: 0 } };
  audio.play('hint');
  persist();
};

const handleButton = (id) => {
  if (id === 'hint') return useHint();
  const next = id === 'undo' ? undo(session) : restart(session);
  if (next === session || (id === 'restart' && session.moves === 0)) return;
  session = next;
  stuck = !hasMoves(session.jars, session.capacity);
  fx = { ...fx, hint: null, introT: id === 'restart' ? 0 : fx.introT };
  audio.play('back');
};

// O anuncio com recompensa so abre depois de o jogador tocar em "Ver anuncio".
const acceptOffer = async () => {
  offerT = null;
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_HINTS).finally(() => { busy = false; });
  if (!earned) return toast(strings.adUnavailable);
  progress = { ...progress, hints: progress.hints + CONFIG.hintsPerAd };
  persist();
  toast(strings.hintsEarned);
  audio.play('jar');
};

// Anuncio entre fases: so na troca de tela, nunca no meio da jogada.
const goToNextLevel = async () => {
  const level = session.level + 1;
  const dueForAd = level >= CONFIG.firstInterstitialLevel && (level - CONFIG.firstInterstitialLevel) % CONFIG.interstitialEveryLevels === 0;
  if (dueForAd) {
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  loadLevel(level);
};

const handlePointer = (x, y) => {
  if (!running || busy) return;
  audio.unlock();
  if (offerT !== null) {
    const panel = panelLayout(view);
    if (inRect(panel.primary, x, y)) acceptOffer();
    else if (inRect(panel.secondary, x, y) || !inRect(panel.card, x, y)) offerT = null;
    return;
  }
  if (session.phase === PHASE.WON) {
    if (fx.winT > CONFIG.winDelaySeconds + 0.3) goToNextLevel();
    return;
  }
  if (fx.flight) return;
  const button = buttonAt(layout, x, y);
  if (button) return handleButton(button);
  const jar = jarAt(layout, x, y);
  if (jar >= 0) return handleJar(jar);
  session = clearSelection(session);
};

const handleKey = (event) => {
  if (event.repeat || !running || busy) return;
  const digit = Number(event.key);
  if (Number.isInteger(digit) && digit >= 1 && offerT === null && session.phase === PHASE.PLAYING && !fx.flight) {
    audio.unlock();
    handleJar(digit - 1);
    return;
  }
  const point = { Enter: 'next', KeyZ: 'undo', KeyR: 'restart', KeyH: 'hint' }[event.code];
  if (!point) return;
  event.preventDefault();
  audio.unlock();
  if (point === 'next') {
    if (session.phase === PHASE.WON && fx.winT > CONFIG.winDelaySeconds + 0.3) goToNextLevel();
  } else if (offerT === null && session.phase === PHASE.PLAYING && !fx.flight) {
    handleButton(point);
  }
};

const bindInput = () => {
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handlePointer(event.clientX, event.clientY);
  });
  window.addEventListener('keydown', handleKey);
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    stopLoop();
    audio.suspend();
    persist();
  });
  platform.onResume(() => {
    paused = false;
    audio.resume();
    if (booted) startLoop();
  });
};

const boot = async () => {
  // Ouvir o tamanho desde o comeco: o YouTube pode redimensionar o jogo durante o carregamento.
  window.addEventListener('resize', resize);
  // Soltar o dedo conta como gesto do jogador em todo navegador, o toque inicial nem sempre.
  window.addEventListener('pointerup', () => audio.unlock());
  resize();
  drawLoading(ctx, view, strings);
  platform.firstFrameReady();
  // Registrar antes de carregar: a pausa pode chegar durante o carregamento.
  bindPlatform();

  const [raw, locale] = await Promise.all([platform.loadData(), platform.getLanguage()]);
  progress = parseSave(raw);
  strings = stringsFor(locale);
  // O tamanho pode ter mudado enquanto os dados carregavam.
  resize();
  loadLevel(progress.level);

  bindInput();
  booted = true;
  if (paused) drawFrame();
  else startLoop();
  platform.gameReady();
};

boot().catch((error) => {
  console.error('[boot] falha ao iniciar o jogo', error);
  // Sem isto o jogador ficaria preso na tela de carregamento do YouTube.
  platform.gameReady();
});
