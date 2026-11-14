// Ponto de entrada: liga a simulacao, o desenho, o audio e o SDK do YouTube Playables.
import { CONFIG, DESIGN, PHASE, REWARD_ID_REVIVE, SLOTS } from './config.js';
import { EVENT, buyHero, createState, isBossWave, moveHero, revive, startRun, step } from './sim.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { buildWorld } from './world.js';
import { tierHue } from './actors.js';
import { floatText, ring, sparks, stepFx } from './fx.js';
import { BUY_BUTTON, PANEL, inRect } from './hud.js';
import { BANNER_SECONDS, TOAST_SECONDS, drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const SLOT_GRAB_RADIUS = 30;
const SHOT_SOUND_GAP = 0.09;
const OVER_INPUT_DELAY = 0.6;
const EMPTY_UI = Object.freeze({
  drag: null, banner: null, toast: null, shake: 0, coinPop: 0, buyPressed: 0, overT: 0, mergedOnce: false,
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let world = null;
let state = createState();
let ui = { ...EMPTY_UI, time: 0, fx: [], recoil: {}, shotSoundT: 0 };
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
const drawFrame = () => drawScene(ctx, { state, view, world, strings, ui });

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  world = buildWorld(view);
  ui = { ...ui, drag: null };
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted) drawFrame();
};

const toDesign = (clientX, clientY) => ({
  x: (clientX - view.ox) / view.scale,
  y: (clientY - view.oy) / view.scale,
});

const slotAt = (x, y) => {
  let best = -1;
  let bestDistance = SLOT_GRAB_RADIUS;
  SLOTS.forEach((slot, index) => {
    const distance = Math.hypot(x - slot.x, y - (slot.y - 12));
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
};

const onEvent = (event) => {
  switch (event.type) {
    case EVENT.SHOT:
      ui = { ...ui, recoil: { ...ui.recoil, [event.slot]: 1 } };
      if (ui.shotSoundT <= 0) {
        audio.play('shot', event.tier);
        ui = { ...ui, shotSoundT: SHOT_SOUND_GAP };
      }
      break;
    case EVENT.HIT:
      addFx(sparks(event.x, event.y, tierHue(event.tier), 3, 0.6));
      break;
    case EVENT.KILL:
      addFx(sparks(event.x, event.y, event.boss ? 285 : 100, event.boss ? 28 : 8, event.boss ? 1.6 : 1), floatText(event.x, event.y - 12, `+${event.reward}`));
      ui = { ...ui, coinPop: 1 };
      audio.play('kill', event.boss ? -7 : 0);
      break;
    case EVENT.LEAK:
      ui = { ...ui, shake: 1 };
      audio.play('leak');
      break;
    case EVENT.WAVE_START: {
      const boss = isBossWave(event.wave);
      ui = { ...ui, banner: { text: boss ? strings.boss : `${strings.wave} ${event.wave}`, boss, t: 0 } };
      audio.play(boss ? 'boss' : 'wave');
      break;
    }
    case EVENT.WAVE_CLEAR:
      addFx(floatText(170, 58, `${strings.waveBonus} +${event.bonus}`));
      ui = { ...ui, coinPop: 1 };
      audio.play('clear');
      persist();
      break;
    case EVENT.OVER:
      // Cair de novo depois de reviver e a mesma partida: nao conta duas vezes para o anuncio.
      if (!state.revived) runsEnded += 1;
      ui = { ...ui, overT: 0, drag: null };
      audio.play('over');
      persist();
      platform.sendScore(state.best);
      break;
    default:
  }
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);

const update = (dt) => {
  const result = step(state, dt);
  state = result.state;
  const recoil = Object.fromEntries(Object.entries(ui.recoil).map(([slot, value]) => [slot, fade(value, dt, 6)]));
  ui = {
    ...ui,
    time: ui.time + dt,
    fx: stepFx(ui.fx, dt),
    recoil,
    shake: fade(ui.shake, dt, 2.5),
    coinPop: fade(ui.coinPop, dt, 5),
    buyPressed: fade(ui.buyPressed, dt, 7),
    shotSoundT: ui.shotSoundT - dt,
    banner: advance(ui.banner, dt, BANNER_SECONDS),
    toast: advance(ui.toast, dt, TOAST_SECONDS),
    overT: state.phase === PHASE.OVER ? ui.overT + dt : 0,
  };
  result.events.forEach(onEvent);
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
  state = startRun(state);
  ui = { ...ui, ...EMPTY_UI, fx: [], recoil: {} };
};

const tryBuy = () => {
  const result = buyHero(state);
  ui = { ...ui, buyPressed: 1 };
  if (result.slot < 0) return audio.play('deny');
  state = result.state;
  const slot = SLOTS[result.slot];
  addFx(sparks(slot.x, slot.y - 14, tierHue(1), 12));
  audio.play('buy');
};

// Anuncio entre partidas: so na troca de tela depois do fim de jogo, nunca no meio da partida.
const playAgain = async () => {
  if (runsEnded % CONFIG.interstitialEveryRuns === 0) {
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  beginRun();
};

// O anuncio com recompensa so abre depois de o jogador tocar no botao que diz isso.
const reviveWithAd = async () => {
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_REVIVE).finally(() => { busy = false; });
  if (!earned) return toast(strings.adUnavailable);
  state = revive(state);
  ui = { ...ui, fx: [], banner: null };
  audio.play('merge');
};

const handleOverTap = (x, y) => {
  if (ui.overT < OVER_INPUT_DELAY) return;
  if (state.revived) {
    if (inRect(PANEL.primary, x, y)) playAgain();
  } else if (inRect(PANEL.primary, x, y)) {
    reviveWithAd();
  } else if (inRect(PANEL.secondary, x, y)) {
    playAgain();
  }
};

const handleDown = (x, y, pointerId) => {
  if (!running || busy) return;
  audio.unlock();
  if (state.phase === PHASE.TITLE) return beginRun();
  if (state.phase === PHASE.OVER) return handleOverTap(x, y);
  if (inRect(BUY_BUTTON, x, y)) return tryBuy();
  const slot = slotAt(x, y);
  if (slot >= 0 && state.heroes[slot]) {
    ui = { ...ui, drag: { slot, x, y, over: slot, pointerId } };
    canvas.setPointerCapture?.(pointerId);
  }
};

const handleMove = (x, y) => {
  if (ui.drag) ui = { ...ui, drag: { ...ui.drag, x, y, over: slotAt(x, y + 12) } };
};

const handleUp = () => {
  const { drag } = ui;
  if (!drag) return;
  ui = { ...ui, drag: null };
  if (busy || drag.over < 0 || drag.over === drag.slot) return;
  const result = moveHero(state, drag.slot, drag.over);
  if (result.state === state) return;
  state = result.state;
  const slot = SLOTS[drag.over];
  if (result.merged) {
    const { tier } = state.heroes[drag.over];
    addFx(ring(slot.x, slot.y, tier), sparks(slot.x, slot.y - 14, tierHue(tier), 18, 1.2));
    ui = { ...ui, mergedOnce: true };
    audio.play('merge', tier);
  } else {
    audio.play('move');
  }
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
    if (!ownsDrag(event)) return;
    const { x, y } = point(event);
    handleMove(x, y);
  });
  ['pointerup', 'pointercancel'].forEach((type) => canvas.addEventListener(type, (event) => {
    if (ownsDrag(event)) handleUp();
  }));
  window.addEventListener('keydown', (event) => {
    if (event.repeat || !running || busy || (event.code !== 'Space' && event.code !== 'Enter')) return;
    event.preventDefault();
    audio.unlock();
    if (state.phase === PHASE.TITLE) beginRun();
    else if (state.phase === PHASE.BUILD || state.phase === PHASE.WAVE) tryBuy();
  });
  window.addEventListener('resize', resize);
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    ui = { ...ui, drag: null };
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
