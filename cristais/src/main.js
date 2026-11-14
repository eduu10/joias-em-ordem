// Ponto de entrada: liga as regras, o desenho, o audio e o SDK do YouTube Playables.
import { CONFIG, DESIGN, FEEL, PHASE, REWARD_ID_REVIVE } from './config.js';
import { EVENT, createState, place, revive, startRun } from './logic.js';
import { SHAPES } from './shapes.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createAudio } from './audio.js';
import { buildWorld } from './cave.js';
import { dropCell, heldPose, slotAt } from './layout.js';
import { EMPTY_UI, applyEvent, stepUi } from './feedback.js';
import { inRect } from './hud.js';
import { PANEL } from './cards.js';
import { drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const SEED_RANGE = 4294967296;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let world = null;
let state = createState();
let ui = { ...EMPTY_UI, time: 0 };
let runsEnded = 0;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

// A semente de cada partida vem de fora das regras, que continuam puras.
const newSeed = () => Math.floor(Math.random() * SEED_RANGE);
// Sair no meio da partida nao pode perder um recorde ja batido.
const persist = () => platform.saveData(serializeSave(Math.max(state.best, state.score)));
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
const drawFrame = () => drawScene(ctx, { state, view, world, strings, ui });

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  // Uma janela ainda sem tamanho (aba escondida) nao pode gerar escala zero.
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  world = buildWorld(view);
  ui = { ...ui, drag: null, back: null };
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted) drawFrame();
};

const toDesign = (clientX, clientY) => ({
  x: (clientX - view.ox) / view.scale,
  y: (clientY - view.oy) / view.scale,
});

const onEvent = (event) => {
  const result = applyEvent(ui, event, strings);
  ui = result.ui;
  result.sounds.forEach(([name, transpose]) => audio.play(name, transpose));
  if (event.type !== EVENT.OVER) return;
  // Cair de novo depois de continuar e a mesma partida: nao conta duas vezes para o anuncio.
  if (!state.revived) runsEnded += 1;
  persist();
  platform.sendScore(state.best);
};

const apply = (result) => {
  state = result.state;
  result.events.forEach(onEvent);
};

const update = (dt) => {
  ui = stepUi(ui, dt, state);
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
  ui = { ...EMPTY_UI, time: ui.time };
  audio.play('start');
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
  return apply(revive(state));
};

const handleOverTap = (x, y) => {
  if (ui.overT < FEEL.overInputDelay) return;
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
  const slot = slotAt(x, y);
  if (slot < 0 || state.tray[slot] === null) return;
  ui = { ...ui, drag: { slot, pointerId, x, y, t: 0 }, back: null };
  canvas.setPointerCapture?.(pointerId);
  audio.play('pick');
};

const handleMove = (x, y) => {
  if (ui.drag) ui = { ...ui, drag: { ...ui.drag, x, y } };
};

// Devolve a peca para a bandeja com uma animacao curta.
const sendBack = (drag) => {
  const shape = SHAPES[state.tray[drag.slot]];
  ui = { ...ui, drag: null, back: shape ? { slot: drag.slot, from: heldPose(shape, drag), t: 0 } : null };
};

const handleUp = () => {
  const { drag } = ui;
  if (!drag) return;
  const shape = SHAPES[state.tray[drag.slot]];
  const cell = shape ? dropCell(shape, drag) : null;
  const result = cell && !busy ? place(state, drag.slot, cell.col, cell.row) : { state, events: [] };
  if (result.state === state) {
    sendBack(drag);
    audio.play('back');
    return;
  }
  ui = { ...ui, drag: null };
  apply(result);
};

const handleCancel = () => {
  if (ui.drag) sendBack(ui.drag);
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
  canvas.addEventListener('pointerup', (event) => {
    if (!ownsDrag(event)) return;
    const { x, y } = point(event);
    handleMove(x, y);
    handleUp();
  });
  canvas.addEventListener('pointercancel', (event) => {
    if (ownsDrag(event)) handleCancel();
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat || !running || busy || (event.code !== 'Space' && event.code !== 'Enter')) return;
    event.preventDefault();
    audio.unlock();
    if (state.phase === PHASE.TITLE) beginRun();
    else if (state.phase === PHASE.OVER && ui.overT >= FEEL.overInputDelay) playAgain();
  });
  window.addEventListener('resize', resize);
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => audio.setEnabled(isEnabled));
  platform.onPause(() => {
    paused = true;
    // Um arrasto pela metade e cancelado: a peca volta para a bandeja sem ser jogada.
    ui = { ...ui, drag: null, back: null };
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
  state = createState(parseSave(raw).best, newSeed());
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
