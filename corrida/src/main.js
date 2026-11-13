// Ponto de entrada: liga a simulacao, o desenho, o audio e o SDK do YouTube Playables.
import { ACTION, CONFIG, DESIGN, ITEM, PHASE, REWARD_ID_REVIVE } from './config.js';
import { EVENT, act, createState, isSliding, revive, speedAt, startRun, step } from './sim.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { bindInput } from './input.js';
import { dust, floatText, ring, sparks, stepFx } from './fx.js';
import { PANEL, inRect } from './hud.js';
import { OVER_CARD_DELAY, TOAST_SECONDS, drawLoading, drawScene, playerScreenPoint, worldScreenPoint } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const OVER_INPUT_DELAY = OVER_CARD_DELAY + 0.5;
const TITLE_SCROLL_SPEED = 7;
const COIN_STREAK_SECONDS = 0.7;
const COIN_STREAK_MAX = 12;
const SLIDE_DUST_PER_SECOND = 26;
const FLASH = Object.freeze({ crash: '255, 90, 80', shield: '120, 220, 255', power: '255, 255, 255' });
const EMPTY_UI = Object.freeze({
  toast: null, shake: 0, flash: 0, flashColor: FLASH.crash, coinPop: 0, overT: 0, streak: 0, streakT: 0, slideAmount: 0,
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let state = createState();
let ui = { ...EMPTY_UI, time: 0, fx: [], runPhase: 0, titleScroll: 0, firstRun: true, bestAtStart: 0 };
let input = null;
let runsStarted = 0;
let runsEnded = 0;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

const persist = () => platform.saveData(serializeSave(state.best));
const addFx = (...items) => { ui = { ...ui, fx: [...ui.fx, ...items.flat()] }; };
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
const drawFrame = () => drawScene(ctx, { state, view, strings, ui });
const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  input?.cancel();
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted && !running) drawFrame();
};

const toDesign = (clientX, clientY) => ({
  x: (clientX - view.ox) / view.scale,
  y: (clientY - view.oy) / view.scale,
});

const onCoin = (event) => {
  const point = worldScreenPoint(state, event.lane, event.h, event.z);
  const streak = ui.streakT > 0 ? Math.min(COIN_STREAK_MAX, ui.streak + 1) : 0;
  addFx(sparks(point.x, point.y, 48, 5, 0.7));
  ui = { ...ui, coinPop: 1, streak, streakT: COIN_STREAK_SECONDS };
  audio.play('coin', streak);
};

const onPower = (event) => {
  const point = playerScreenPoint(state);
  const magnet = event.item === ITEM.MAGNET;
  addFx(ring(point.x, point.y - 38, magnet ? '#ff8fa8' : '#8fe4ff', 64), sparks(point.x, point.y - 38, magnet ? 345 : 195, 16, 1.1),
    floatText(point.x, point.y - 96, magnet ? strings.magnet : strings.shield, '#ffffff', 17));
  ui = { ...ui, flash: 0.35, flashColor: FLASH.power };
  audio.play('power');
};

const onImpact = (shielded) => {
  const point = playerScreenPoint(state);
  addFx(ring(point.x, point.y - 38, shielded ? '#8fe4ff' : '#ffd0a0', shielded ? 70 : 90),
    sparks(point.x, point.y - 38, shielded ? 195 : 28, shielded ? 20 : 34, shielded ? 1.2 : 1.6));
  ui = { ...ui, shake: shielded ? 0.6 : 1, flash: shielded ? 0.5 : 1, flashColor: shielded ? FLASH.shield : FLASH.crash };
  audio.play(shielded ? 'shield' : 'crash');
};

const onOver = () => {
  // Bater de novo depois de reviver e a mesma partida: nao conta duas vezes para o anuncio.
  if (!state.revived) runsEnded += 1;
  ui = { ...ui, overT: 0 };
  input?.cancel();
  audio.play('over');
  persist();
  platform.sendScore(state.best);
};

const onEvent = (event) => {
  const foot = playerScreenPoint(state);
  switch (event.type) {
    case EVENT.LANE: audio.play('lane'); break;
    case EVENT.BUMP: audio.play('bump'); ui = { ...ui, shake: Math.max(ui.shake, 0.2) }; break;
    case EVENT.JUMP: audio.play('jump'); addFx(dust(foot.x, foot.y, 3)); break;
    case EVENT.LAND: audio.play('land'); addFx(dust(foot.x, foot.y, 5)); break;
    case EVENT.SLIDE: audio.play('slide'); break;
    case EVENT.COIN: onCoin(event); break;
    case EVENT.POWER: onPower(event); break;
    case EVENT.SHIELD_BREAK: onImpact(true); break;
    case EVENT.CRASH: onImpact(false); break;
    case EVENT.OVER: onOver(); break;
    case EVENT.MILESTONE:
      addFx(floatText(DESIGN.w / 2, 170, `${event.meters} ${strings.meters}`, '#ffffff', 26));
      audio.play('milestone');
      break;
    default:
  }
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const approach = (value, target, dt, perSecond) => value + Math.max(-dt * perSecond, Math.min(dt * perSecond, target - value));
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);

const update = (dt) => {
  const result = step(state, dt);
  state = result.state;
  const playing = state.phase === PHASE.RUN;
  const slidingNow = playing && isSliding(state);
  ui = {
    ...ui,
    time: ui.time + dt,
    fx: stepFx(ui.fx, dt),
    runPhase: ui.runPhase + (playing ? dt * (9 + speedAt(state.distance) * 0.45) : 0),
    titleScroll: ui.titleScroll + (state.phase === PHASE.TITLE ? dt * TITLE_SCROLL_SPEED : 0),
    slideAmount: approach(ui.slideAmount, slidingNow ? 1 : 0, dt, 11),
    shake: fade(ui.shake, dt, 2.4),
    flash: fade(ui.flash, dt, 3.2),
    coinPop: fade(ui.coinPop, dt, 5),
    streakT: fade(ui.streakT, dt, 1),
    toast: advance(ui.toast, dt, TOAST_SECONDS),
    overT: state.phase === PHASE.OVER ? ui.overT + dt : 0,
  };
  result.events.forEach(onEvent);
  if (slidingNow && !state.airborne && Math.random() < dt * SLIDE_DUST_PER_SECOND) {
    const foot = playerScreenPoint(state);
    addFx(dust(foot.x, foot.y, 1));
  }
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

const beginRun = () => {
  const bestAtStart = state.best;
  state = startRun(state, newSeed());
  ui = { ...ui, ...EMPTY_UI, fx: [], firstRun: runsStarted === 0, bestAtStart };
  runsStarted += 1;
  audio.play('start');
};

const doAction = (action) => {
  if (!running || busy || state.phase !== PHASE.RUN) return;
  const result = act(state, action);
  state = result.state;
  result.events.forEach(onEvent);
};

// Anuncio entre partidas: so na troca de tela depois do fim de jogo, nunca no meio da corrida.
const playAgain = async () => {
  if (busy) return;
  if (runsEnded % CONFIG.interstitialEveryRuns === 0) {
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  beginRun();
};

// O anuncio com recompensa so abre depois de o jogador tocar no botao que diz isso.
const reviveWithAd = async () => {
  if (busy) return;
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_REVIVE).finally(() => { busy = false; });
  if (!earned) { toast(strings.adUnavailable); return; }
  state = revive(state);
  ui = { ...ui, shake: 0, flash: 0.4, flashColor: FLASH.shield, slideAmount: 0 };
  audio.play('revive');
};

const overReady = () => state.phase === PHASE.OVER && ui.overT >= OVER_INPUT_DELAY;

const handleOverTap = (x, y) => {
  if (!overReady()) return;
  if (state.revived) {
    if (inRect(PANEL.primary, x, y)) playAgain();
  } else if (inRect(PANEL.primary, x, y)) {
    reviveWithAd();
  } else if (inRect(PANEL.secondary, x, y)) {
    playAgain();
  }
};

// Devolve true quando o toque deve virar um gesto de corrida (deslizar ou toque nas metades da tela).
const handleDown = (clientX, clientY) => {
  if (!running || busy) return false;
  audio.unlock();
  if (state.phase === PHASE.TITLE) { beginRun(); return false; }
  if (state.phase === PHASE.OVER) {
    const { x, y } = toDesign(clientX, clientY);
    handleOverTap(x, y);
    return false;
  }
  return true;
};

const handleKey = (action, confirm) => {
  if (!running || busy) return;
  audio.unlock();
  if (state.phase === PHASE.TITLE) {
    if (confirm || action === ACTION.JUMP) beginRun();
  } else if (state.phase === PHASE.OVER) {
    // O teclado so reinicia: o anuncio com recompensa exige o toque no botao dele.
    if (confirm && overReady()) playAgain();
  } else if (action) {
    doAction(action);
  }
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    input?.cancel();
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
  resize();
  drawLoading(ctx, view, strings);
  platform.firstFrameReady();
  // Registrar antes de carregar: a pausa pode chegar durante o carregamento.
  bindPlatform();

  const [raw, locale] = await Promise.all([platform.loadData(), platform.getLanguage()]);
  state = createState(parseSave(raw).best);
  strings = stringsFor(locale);

  input = bindInput(canvas, { onDown: handleDown, onAction: doAction, onKey: handleKey });
  window.addEventListener('resize', resize);
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
