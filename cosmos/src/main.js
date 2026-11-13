// Ponto de entrada: liga a simulacao, o desenho, o audio e o SDK do YouTube Playables.
import { CAPSULE, CONFIG, DESIGN, PHASE, REWARD_ID_CONTINUE, TIERS } from './config.js';
import { EVENT, createState, drop, revive, startRun, step } from './sim.js';
import { tierRadius } from './physics.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { buildWorld } from './world.js';
import { buildSprites } from './sprites.js';
import { flash, floatText, ring, sparks, stepFx } from './fx.js';
import { inRect } from './hud.js';
import { PANEL } from './cards.js';
import { SHOUT_SECONDS, TOAST_SECONDS, drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const OVER_INPUT_DELAY = 0.7;
const BUMP_SOUND_GAP = 0.07;
const WARN_SOUND_GAP = 0.55;
const SHAKE_FROM_TIER = 4;
const AIM_START = (CAPSULE.left + CAPSULE.right) / 2;
const EMPTY_UI = Object.freeze({
  drag: null, toast: null, shout: null, shake: 0, scorePop: 0, overT: 0, record: false, aimX: AIM_START, bumpSoundT: 0, warnT: 0,
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let world = null;
let sprites = null;
let state = createState();
let ui = { ...EMPTY_UI, time: 0, fx: [], squash: {}, keys: { left: false, right: false } };
let runsEnded = 0;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

const persist = () => platform.saveData(serializeSave(Math.max(state.best, state.score)));
const addFx = (...items) => { ui = { ...ui, fx: [...ui.fx, ...items.flat()] }; };
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
const drawFrame = () => drawScene(ctx, { state, view, world, sprites, strings, ui });
const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  // Uma janela ainda sem tamanho (0 x 0) nao pode virar divisao por zero no desenho.
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  world = buildWorld(view);
  sprites = buildSprites(ratio * scale);
  ui = { ...ui, drag: null };
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted && !running) drawFrame();
};

const toDesign = (clientX, clientY) => ({
  x: (clientX - view.ox) / view.scale,
  y: (clientY - view.oy) / view.scale,
});

const onMerge = (event) => {
  const { color } = TIERS[event.tier];
  const radius = tierRadius(event.tier);
  const big = event.tier >= SHAKE_FROM_TIER;
  addFx(
    flash(event.x, event.y, radius * (event.final ? 1.8 : 1.15)),
    ring(event.x, event.y, radius, color),
    big ? ring(event.x, event.y, radius * 1.3, color, 0.1) : [],
    sparks(event.x, event.y, color, (event.final ? 60 : 8) + event.tier * 3, 0.8 + event.tier * 0.12),
    floatText(event.x, event.y - radius - 4, `+${event.score}`, 13 + event.tier),
  );
  const shake = event.final ? 1 : Math.min(1, 0.45 + (event.tier - SHAKE_FROM_TIER) * 0.11);
  ui = {
    ...ui,
    scorePop: 1,
    shake: big ? Math.max(ui.shake, shake) : ui.shake,
    shout: event.final ? { text: strings.bigBang, t: 0 } : ui.shout,
  };
  audio.play(event.final ? 'bigBang' : 'merge', event.tier * 2 - 6);
  if (big) audio.play('shine', event.tier - 6);
};

const onBump = (event) => {
  const strength = Math.min(1, event.power / 700);
  ui = { ...ui, squash: { ...ui.squash, [event.id]: Math.max(ui.squash[event.id] ?? 0, strength) } };
  if (ui.bumpSoundT > 0) return;
  audio.play('bump', Math.round(strength * 10));
  ui = { ...ui, bumpSoundT: BUMP_SOUND_GAP };
};

const onOver = (event) => {
  // Cair de novo depois de continuar e a mesma partida: nao conta duas vezes para o anuncio.
  if (!state.revived) runsEnded += 1;
  ui = { ...ui, overT: 0, drag: null, record: event.record, keys: { left: false, right: false } };
  audio.play('over');
  persist();
  platform.sendScore(state.best);
};

const onEvent = (event) => {
  if (event.type === EVENT.MERGE) onMerge(event);
  else if (event.type === EVENT.BUMP) onBump(event);
  else if (event.type === EVENT.OVER) onOver(event);
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);
const fadeAll = (map, dt, perSecond) => Object.fromEntries(
  Object.entries(map).map(([key, value]) => [key, value - dt * perSecond]).filter(([, value]) => value > 0),
);

const soundWarning = () => {
  if (state.phase !== PHASE.PLAY || state.dangerT < CONFIG.dangerSeconds * 0.25 || ui.warnT > 0) return;
  audio.play('warn');
  ui = { ...ui, warnT: WARN_SOUND_GAP };
};

const update = (dt) => {
  const steer = (ui.keys.right ? 1 : 0) - (ui.keys.left ? 1 : 0);
  const aimX = Math.min(CAPSULE.right, Math.max(CAPSULE.left, ui.aimX + steer * CONFIG.aimKeySpeed * dt));
  const result = step(state, dt);
  state = result.state;
  ui = {
    ...ui,
    aimX,
    time: ui.time + dt,
    fx: stepFx(ui.fx, dt),
    squash: fadeAll(ui.squash, dt, 5),
    shake: fade(ui.shake, dt, 2.2),
    scorePop: fade(ui.scorePop, dt, 4),
    bumpSoundT: ui.bumpSoundT - dt,
    warnT: ui.warnT - dt,
    toast: advance(ui.toast, dt, TOAST_SECONDS),
    shout: advance(ui.shout, dt, SHOUT_SECONDS),
    overT: state.phase === PHASE.OVER ? ui.overT + dt : 0,
  };
  result.events.forEach(onEvent);
  soundWarning();
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
  state = startRun(state, newSeed());
  ui = { ...ui, ...EMPTY_UI, fx: [], squash: {}, keys: { left: false, right: false } };
  audio.play('start');
};

const tryDrop = () => {
  const before = state;
  state = drop(state, ui.aimX);
  if (state !== before) audio.play('drop', before.current * -2);
};

// Anuncio entre partidas: so na troca de tela depois do fim de jogo, nunca no meio da partida.
const playAgain = async () => {
  if (busy) return;
  if (runsEnded % CONFIG.interstitialEveryRuns === 0) {
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  beginRun();
};

// O anuncio com recompensa so abre depois de o jogador tocar no botao que diz isso.
const continueWithAd = async () => {
  if (busy) return;
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_CONTINUE).finally(() => { busy = false; });
  if (!earned) {
    audio.play('deny');
    return toast(strings.adUnavailable);
  }
  const before = state.bodies;
  state = revive(state);
  const kept = new Set(state.bodies.map((body) => body.id));
  addFx(before.filter((body) => !kept.has(body.id)).map((body) => sparks(body.x, body.y, TIERS[body.tier].color, 10)));
  ui = { ...ui, shout: null, toast: { text: strings.continued, t: 0 } };
  audio.play('revive');
};

const handleOverTap = (x, y) => {
  if (ui.overT < OVER_INPUT_DELAY) return;
  if (state.revived) {
    if (inRect(PANEL.primary, x, y)) playAgain();
  } else if (inRect(PANEL.primary, x, y)) {
    continueWithAd();
  } else if (inRect(PANEL.secondary, x, y)) {
    playAgain();
  }
};

const handleDown = (x, y, pointerId) => {
  if (!running || busy) return;
  audio.unlock();
  if (state.phase === PHASE.TITLE) return beginRun();
  if (state.phase === PHASE.OVER) return handleOverTap(x, y);
  ui = { ...ui, aimX: x, drag: { pointerId } };
  // A captura falha se o ponteiro ja foi solto: o arrasto segue valendo sem ela.
  try { canvas.setPointerCapture?.(pointerId); } catch { /* ponteiro ja inativo */ }
};

const handleUp = (cancelled) => {
  ui = { ...ui, drag: null };
  if (!cancelled && running && !busy) tryDrop();
};

const handleKey = (event, down) => {
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    const side = event.code === 'ArrowLeft' ? 'left' : 'right';
    ui = { ...ui, keys: { ...ui.keys, [side]: down && running && state.phase === PHASE.PLAY } };
    event.preventDefault();
    return;
  }
  if (!down || event.repeat || !running || busy || (event.code !== 'Space' && event.code !== 'Enter')) return;
  event.preventDefault();
  audio.unlock();
  if (state.phase === PHASE.TITLE) beginRun();
  else if (state.phase === PHASE.PLAY) tryDrop();
  else if (ui.overT >= OVER_INPUT_DELAY) playAgain();
};

const bindInput = () => {
  const point = (event) => toDesign(event.clientX, event.clientY);
  // So o dedo (ou botao) que comecou o arrasto pode move-lo ou solta-lo.
  const ownsDrag = (event) => ui.drag && ui.drag.pointerId === event.pointerId;
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (ui.drag) return;
    const { x, y } = point(event);
    handleDown(x, y, event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    // O mouse tambem mira sem apertar o botao.
    const hovering = !ui.drag && event.pointerType === 'mouse' && state.phase === PHASE.PLAY;
    if (ownsDrag(event) || hovering) ui = { ...ui, aimX: point(event).x };
  });
  canvas.addEventListener('pointerup', (event) => { if (ownsDrag(event)) handleUp(false); });
  canvas.addEventListener('pointercancel', (event) => { if (ownsDrag(event)) handleUp(true); });
  window.addEventListener('keydown', (event) => handleKey(event, true));
  window.addEventListener('keyup', (event) => handleKey(event, false));
  window.addEventListener('resize', resize);
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    ui = { ...ui, drag: null, keys: { left: false, right: false } };
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
