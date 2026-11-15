// Ponto de entrada: liga a simulacao, o desenho, o audio e o SDK do YouTube Playables.
import { CONFIG, DESIGN, PHASE, PHYS, REWARD_ID_DOUBLE, REWARD_ID_TRY } from './config.js';
import { EVENT, SUB_DT, stepRun } from './sim.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { addCoins, buyCar, buyTrack, canFreeTry, createProfile, ownsTrack, selectTrack, useFreeTry } from './economy.js';
import { centerOf } from './carbody.js';
import { followCamera, makeCamera, baseZoom } from './camera.js';
import { addMark, stepFx } from './fx.js';
import { createRandom } from './rng.js';
import { applyEvents } from './effects.js';
import { frameAt } from './replay.js';
import { UI, inRect, meterValue } from './hud.js';
import { TRACKS } from './tracks.js';
import {
  canDrive, createApp, currentCar, finishRun, kmhFromMeter, launch, shiftCar, shouldShowInterstitial,
  stepDemo, toAim, toGarage, toTracks,
} from './flow.js';
import { drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const SWIPE_PIXELS = 40;
const RESULT_INPUT_DELAY = 0.6;
const MAX_STEPS_PER_FRAME = 3;
const RESULT_SETTLED = 10;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());
const rand = createRandom(20251115);

let strings = stringsFor(navigator.language);
let view = { width: 1, height: 1, ratio: 1, scale: 1, ox: 0, oy: 0 };
let app = createApp(createProfile());
let ui = { time: 0, phaseT: 0, cam: makeCamera(view, -40, -2, 30), fx: [], marks: [], shake: 0, flash: 0, banner: null, toast: null, soundT: 0, acc: 0 };
let press = null;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

const persist = () => platform.saveData(serializeSave(app.profile));
const activeRun = () => app.run ?? app.demo;
const replayWorld = () => (app.phase === PHASE.REPLAY ? frameAt(app.run.replay, app.replayT, 1 / PHYS.stepSeconds) : null);
const drawFrame = () => drawScene(ctx, { app, view, strings, ui, world: replayWorld() });
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
// Voltar do replay para o resultado nao reanima o cartao.
const setPhase = (next) => {
  const back = app.phase === PHASE.REPLAY && next.phase === PHASE.RESULT;
  ui = { ...ui, phaseT: back ? RESULT_SETTLED : next.phase === app.phase ? ui.phaseT : 0 };
  app = next;
};

const resetCamera = () => {
  const world = replayWorld() ?? activeRun().world;
  const c = centerOf(world.bodies[0]);
  ui = { ...ui, cam: makeCamera(view, c.x, c.y - 1.5, baseZoom(view, activeRun().car.len)), marks: [], fx: [] };
};

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  // Uma janela ainda sem tamanho (0 x 0) nao pode virar escala zero no desenho.
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  resetCamera();
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted) drawFrame();
};

const toDesign = (clientX, clientY) => ({ x: (clientX - view.ox) / view.scale, y: (clientY - view.oy) / view.scale });

const onRunEvents = (events, live) => {
  const c = centerOf(activeRun().world.bodies[0]);
  ui = applyEvents(ui, events, { rand, strings, audio: live ? audio : null, vx: c.vx / SUB_DT });
  if (live && events.some((e) => e.type === EVENT.DONE)) {
    setPhase(finishRun(app));
    persist();
    platform.sendScore(app.bestTotal);
    audio.play(app.record ? 'record' : 'coin');
  }
};

// Marcas de pneu enquanto o carro freia no chao.
const markTires = (before, after) => {
  if (!after.brake) return;
  after.bodies.forEach((body, b) => body.nodes.forEach((n, i) => {
    if (n.kind !== 'wheel' || n.y < -n.r - 0.05) return;
    const old = before.bodies[b]?.nodes[i];
    if (old && Math.abs(n.x - old.x) > 0.02) ui = { ...ui, marks: addMark(ui.marks, old.x, n.x, 0) };
  }));
};

const stepWorld = (dt) => {
  if (app.phase === PHASE.REPLAY) {
    const replayT = app.replayT + dt * CONFIG.replaySpeed;
    if (replayT * 60 >= app.run.replay.frames.length) setPhase({ ...app, phase: PHASE.RESULT });
    else app = { ...app, replayT };
    return;
  }
  const live = app.phase === PHASE.RUN;
  const demo = !app.run;
  if (!live && !demo) return;
  ui = { ...ui, acc: Math.min(ui.acc + dt, PHYS.stepSeconds * MAX_STEPS_PER_FRAME) };
  while (ui.acc >= PHYS.stepSeconds && app.phase !== PHASE.RESULT) {
    ui = { ...ui, acc: ui.acc - PHYS.stepSeconds };
    const before = activeRun().world;
    const result = demo ? stepDemo(app.demo) : stepRun(app.run);
    app = demo ? { ...app, demo: result.state } : { ...app, run: result.state };
    if (result.restarted) resetCamera();
    markTires(before, activeRun().world);
    onRunEvents(result.events, live);
  }
};

const update = (dt) => {
  stepWorld(dt);
  const world = replayWorld() ?? activeRun().world;
  const c = centerOf(world.bodies[0]);
  const speed = Math.hypot(c.vx, c.vy) / SUB_DT;
  const fade = (v, k) => Math.max(0, v - dt * k);
  ui = {
    ...ui,
    time: ui.time + dt,
    phaseT: ui.phaseT + dt,
    cam: followCamera(ui.cam, view, { x: c.x, y: c.y, speed }, activeRun().car.len, dt),
    fx: stepFx(ui.fx, app.phase === PHASE.REPLAY ? dt * CONFIG.replaySpeed : dt),
    shake: fade(ui.shake, 1.6),
    flash: fade(ui.flash, 3),
    soundT: ui.soundT - dt,
    banner: ui.banner && ui.banner.t + dt < 1.6 ? { ...ui.banner, t: ui.banner.t + dt } : null,
    toast: ui.toast && ui.toast.t + dt < 2 ? { ...ui.toast, t: ui.toast.t + dt } : null,
  };
  if (app.phase === PHASE.AIM) {
    const meter = meterValue(ui.phaseT, CONFIG.meterHz);
    app = { ...app, meter, aimKmh: kmhFromMeter(meter) };
  }
  if (app.phase === PHASE.RUN) app = { ...app, kmh: Math.round(speed * 3.6) };
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

const withBusy = async (task) => {
  busy = true;
  try { return await task(); } finally { busy = false; }
};

// Anuncio entre testes: so na troca de tela depois do resultado, nunca durante um teste.
const leaveResult = async (next) => {
  if (shouldShowInterstitial(app)) {
    app = { ...app, adShownFor: app.crashes };
    await withBusy(() => platform.showInterstitial());
  }
  setPhase(next(app));
  resetCamera();
};

const doubleCoins = async () => {
  const earned = await withBusy(() => platform.showRewarded(REWARD_ID_DOUBLE));
  if (!earned || app.doubled) return toast(strings.adUnavailable);
  app = { ...app, profile: addCoins(app.profile, app.coinsWon), coinsWon: app.coinsWon * 2, doubled: true };
  persist();
  audio.play('record');
};

const freeTry = async (car) => {
  const earned = await withBusy(() => platform.showRewarded(REWARD_ID_TRY));
  const result = earned ? useFreeTry(app.profile, car.id) : { ok: false };
  if (!result.ok) return toast(strings.adUnavailable);
  app = { ...app, profile: result.profile, trialCar: car.id };
  persist();
  setPhase(toTracks(app));
};

const tapGarage = (x, y) => {
  const car = currentCar(app);
  if (inRect(UI.prev, x, y)) return setPhase(shiftCar(app, -1));
  if (inRect(UI.next, x, y)) return setPhase(shiftCar(app, 1));
  if (canDrive(app, car.id)) {
    if (inRect(UI.go, x, y)) setPhase(toTracks(app));
    return;
  }
  if (inRect(UI.action, x, y)) {
    const result = buyCar(app.profile, car.id);
    if (!result.ok) return void (audio.play('deny'), toast(strings.noCoins));
    app = { ...app, profile: result.profile };
    persist();
    audio.play('buy');
  } else if (inRect(UI.go, x, y) && canFreeTry(app.profile, car.id)) {
    freeTry(car);
  }
};

const tapTracks = (x, y) => {
  if (inRect(UI.back, x, y)) return setPhase(toGarage(app));
  const index = UI.cards.findIndex((r) => inRect(r, x, y));
  if (index < 0) return;
  const track = TRACKS[index];
  if (ownsTrack(app.profile, track.id)) {
    app = { ...app, profile: selectTrack(app.profile, track.id) };
    setPhase(toAim(app));
    resetCamera();
    return;
  }
  const result = buyTrack(app.profile, track.id);
  if (!result.ok) return void (audio.play('deny'), toast(strings.noCoins));
  app = { ...app, profile: result.profile };
  persist();
  audio.play('buy');
};

const tapResult = (x, y) => {
  if (ui.phaseT < RESULT_INPUT_DELAY) return;
  if (inRect(UI.replay, x, y)) {
    setPhase({ ...app, phase: PHASE.REPLAY, replayT: 0 });
    resetCamera();
  } else if (inRect(UI.double, x, y) && !app.doubled) doubleCoins();
  else if (inRect(UI.again, x, y)) leaveResult((a) => (canDrive(a, currentCar(a).id) ? toAim(a) : toGarage(a)));
  else if (inRect(UI.garage, x, y)) leaveResult(toGarage);
};

const handleTap = (x, y) => {
  if (!running || busy) return;
  audio.unlock();
  switch (app.phase) {
    case PHASE.TITLE: audio.play('click'); return setPhase(toGarage(app));
    case PHASE.GARAGE: return tapGarage(x, y);
    case PHASE.TRACKS: return tapTracks(x, y);
    case PHASE.AIM: audio.play('launch'); setPhase(launch(app)); return resetCamera();
    case PHASE.RESULT: return tapResult(x, y);
    case PHASE.REPLAY: return setPhase({ ...app, phase: PHASE.RESULT });
    default:
  }
};

const bindInput = () => {
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    press = { pointerId: event.pointerId, ...toDesign(event.clientX, event.clientY) };
  });
  ['pointerup', 'pointercancel'].forEach((type) => canvas.addEventListener(type, (event) => {
    if (!press || press.pointerId !== event.pointerId) return;
    const start = press;
    press = null;
    if (type === 'pointercancel') return;
    const end = toDesign(event.clientX, event.clientY);
    const dx = end.x - start.x;
    // Deslizar na garagem troca de carro.
    if (app.phase === PHASE.GARAGE && Math.abs(dx) > SWIPE_PIXELS && !busy) return setPhase(shiftCar(app, dx < 0 ? 1 : -1));
    handleTap(start.x, start.y);
  }));
  window.addEventListener('keydown', (event) => {
    if (event.repeat || !running || busy || (event.code !== 'Space' && event.code !== 'Enter')) return;
    event.preventDefault();
    audio.unlock();
    if (app.phase === PHASE.TITLE || app.phase === PHASE.AIM || app.phase === PHASE.REPLAY) handleTap(0, 0);
    else if (app.phase === PHASE.RESULT) tapResult(UI.again.x + 1, UI.again.y + 1);
  });
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    press = null;
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
  app = createApp(parseSave(raw));
  strings = stringsFor(locale);
  // O tamanho pode ter mudado enquanto os dados carregavam.
  resize();

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
