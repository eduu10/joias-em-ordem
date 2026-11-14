// Ponto de entrada: liga a logica do jogo, o desenho, o sintetizador e o SDK do YouTube Playables.
import { CONFIG, DESIGN, MODE, PHASE, REWARD_ID_REVIVE, SCREEN } from './config.js';
import { EVENT, answer, canRevive, createGame, dateKeyOf, restartLine, revive, step } from './game.js';
import { playbackNotes, songById } from './songs.js';
import { applyRun, emptySave, parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createRng } from './rng.js';
import { createSynth } from './synth.js';
import { confetti, floatText, sparks, stepFx } from './fx.js';
import { CARDS, HOME, OVER, inRect } from './layout.js';
import { OVER_INPUT_DELAY } from './screens.js';
import { TOAST_SECONDS, drawLoading, drawScene } from './scene.js';

const MAX_PIXEL_RATIO = 2;
const PRESS_SECONDS = 0.16;
const STREAK_CONFETTI = 3;
const CARD_KEYS = Object.freeze(['Digit1', 'Digit2', 'Digit3', 'Digit4']);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const synth = createSynth(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let save = emptySave();
let game = null;
let rng = createRng(Date.now());
let today = dateKeyOf(new Date());
let ui = {
  screen: SCREEN.HOME, time: 0, fx: [], press: null, toast: null, overT: 0, beat: 0, scorePop: 0, heartPop: 0,
  muted: !platform.isAudioEnabled(), needTap: false, tapAt: -1, silent: false, lastTick: -1,
};
let runsEnded = 0;
let interstitialDue = false;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;

const persist = () => platform.saveData(serializeSave(save));
const addFx = (...items) => { ui = { ...ui, fx: [...ui.fx, ...items.flat()] }; };
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
const drawFrame = () => drawScene(ctx, { game, save, today, view, strings, ui, canRevive: Boolean(game && canRevive(game)) });

const resize = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  // Uma janela ainda sem tamanho (0 x 0) nao pode virar escala zero no desenho.
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const scale = Math.min(width / DESIGN.w, height / DESIGN.h);
  view = { width, height, ratio, scale, ox: (width - DESIGN.w * scale) / 2, oy: (height - DESIGN.h * scale) / 2 };
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  // Mudar o tamanho apaga o canvas. Em pausa nao ha quadro novo, entao redesenha aqui.
  if (booted) drawFrame();
};

const toDesign = (clientX, clientY) => ({ x: (clientX - view.ox) / view.scale, y: (clientY - view.oy) / view.scale });

const inGame = () => ui.screen === SCREEN.GAME && game;
const canHear = () => synth.isSupported() && !ui.silent && !ui.muted && !paused;

// Canta o trecho do comeco ate a palavra escondida (sem ela). A letra anda junto pelo relogio do jogo.
const playLine = () => {
  if (!inGame() || game.phase !== PHASE.LISTEN || !canHear()) return;
  const song = songById(game.round.songId);
  const notes = playbackNotes(song, 0, song.words[game.round.word].first - 1);
  synth.playTune({ notes, tempo: song.tempo, preset: song.preset, delay: Math.max(0, CONFIG.introSeconds - game.t) });
};

// Acertou: toca so o pedacinho da palavra escondida, para confirmar.
const playAnswerBit = () => {
  if (!canHear()) return;
  const song = songById(game.round.songId);
  const word = song.words[game.round.word];
  synth.playTune({ notes: playbackNotes(song, word.first, word.last), tempo: song.tempo, preset: song.preset });
};

const cardCenter = (index) => ({ x: CARDS[index].x + CARDS[index].w / 2, y: CARDS[index].y + CARDS[index].h / 2 });

const onAnswer = (event) => {
  synth.stopTune();
  if (!event.right) {
    synth.playSound('wrong');
    ui = { ...ui, heartPop: 1 };
    return;
  }
  playAnswerBit();
  synth.playSound('tap');
  const c = cardCenter(event.correct);
  addFx(sparks(c.x, c.y, 50, 22, 1.3), floatText(c.x, c.y - 50, `+${event.points}`, '#fff27a', 26));
  if (event.streak >= STREAK_CONFETTI) addFx(confetti(70, DESIGN.w));
  ui = { ...ui, scorePop: 1 };
};

const onRunEnd = () => {
  synth.stopTune();
  save = applyRun(save, game);
  // Cair de novo depois de reviver e a mesma partida: conta uma vez so para o anuncio.
  if (!game.revived) {
    runsEnded += 1;
    interstitialDue = runsEnded % CONFIG.interstitialEveryRuns === 0;
  }
  ui = { ...ui, overT: 0 };
  synth.playSound('over');
  persist();
  platform.sendScore(save.best);
};

const onEvent = (event) => {
  switch (event.type) {
    case EVENT.ROUND_START:
      ui = { ...ui, tapAt: -1, lastTick: -1 };
      playLine();
      break;
    case EVENT.STOP:
      synth.stopTune();
      synth.playSound('stop');
      break;
    case EVENT.ANSWER:
      onAnswer(event);
      break;
    case EVENT.TIMEOUT:
      synth.stopTune();
      synth.playSound('timeout');
      ui = { ...ui, heartPop: 1 };
      break;
    case EVENT.LEVEL_UP:
      toast(`${strings.levelUp} ${event.level}: ${strings.levelUpSuffix}`);
      synth.playSound('levelup');
      break;
    case EVENT.RUN_END:
      onRunEnd();
      break;
    default:
  }
};

const applyResult = (result) => {
  game = result.state;
  result.events.forEach(onEvent);
};

// Sem o audio liberado, a rodada espera um toque. Depois do toque, se o som nao vier, segue so com a letra.
const waitingForSound = () => {
  if (game.phase !== PHASE.LISTEN || !synth.isSupported() || ui.silent || synth.isReady()) return false;
  if (ui.tapAt >= 0 && ui.time - ui.tapAt > CONFIG.tapGraceSeconds) {
    ui = { ...ui, silent: true };
    return false;
  }
  return true;
};

// `realDt`: tempo real do relogio (o tempo de resposta usa este). Congela com som desligado ou em pausa.
const updateGame = (realDt) => {
  if (!inGame() || ui.muted) return;
  const wait = waitingForSound();
  if (wait !== ui.needTap) {
    ui = { ...ui, needTap: wait };
    if (!wait) {
      game = restartLine(game);
      playLine();
    }
  }
  if (wait) return;
  applyResult(step(game, realDt, rng));
  if (game.phase === PHASE.ASK) {
    const left = Math.ceil(game.round.answerSeconds - game.t);
    if (left <= 3 && left !== ui.lastTick) {
      ui = { ...ui, lastTick: left };
      synth.playSound('tick');
    }
  }
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);

const update = (dt, realDt) => {
  const levels = synth.levels();
  const energy = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
  ui = {
    ...ui,
    time: ui.time + dt,
    fx: stepFx(ui.fx, dt),
    press: advance(ui.press, dt, PRESS_SECONDS),
    toast: advance(ui.toast, dt, TOAST_SECONDS),
    beat: Math.max(energy * 2, fade(ui.beat, dt, 3)),
    scorePop: fade(ui.scorePop, dt, 3),
    heartPop: fade(ui.heartPop, dt, 2),
    overT: game?.phase === PHASE.OVER ? ui.overT + dt : 0,
  };
  updateGame(realDt);
};

const frame = (time) => {
  if (!running) return;
  // Agenda o proximo quadro antes de tudo: um erro num quadro nao pode congelar o jogo.
  frameId = requestAnimationFrame(frame);
  // O relogio do quadro pode vir um pouco antes do ultimo tempo guardado: nunca deixar o tempo andar para tras.
  const realDt = Math.max(0, (time - lastTime) / 1000);
  const dt = Math.min(CONFIG.maxFrameSeconds, realDt);
  lastTime = time;
  update(dt, realDt);
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

// Anuncio entre partidas: so na troca de tela depois do fim, nunca durante uma rodada.
const startGame = async (mode) => {
  if (interstitialDue) {
    interstitialDue = false;
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  today = dateKeyOf(new Date());
  rng = createRng((Date.now() ^ (runsEnded * 2654435761)) >>> 0);
  ui = { ...ui, screen: SCREEN.GAME, fx: [], silent: !synth.isSupported(), needTap: false, tapAt: -1, overT: 0 };
  if (!synth.isSupported()) toast(strings.noAudio);
  applyResult(createGame({ mode, dateKey: today }, rng));
};

// O anuncio com recompensa so abre depois de o jogador tocar no botao que diz isso.
const reviveWithAd = async () => {
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_REVIVE).finally(() => { busy = false; });
  if (!earned) return toast(strings.adUnavailable);
  // Quem acabou de ver um anuncio para continuar nao leva outro logo em seguida.
  interstitialDue = false;
  return applyResult(revive(game, rng));
};

const goHome = () => {
  synth.stopTune();
  today = dateKeyOf(new Date());
  game = null;
  ui = { ...ui, screen: SCREEN.HOME, fx: [], needTap: false };
};

const press = (key) => { ui = { ...ui, press: { key, t: 0 } }; };

const tapHome = (x, y) => {
  if (inRect(HOME.run, x, y)) {
    press('run');
    synth.playSound('tap');
    return startGame(MODE.RUN);
  }
  if (!inRect(HOME.daily, x, y)) return undefined;
  press('daily');
  synth.playSound('tap');
  if (save.dailyDate === dateKeyOf(new Date())) return toast(strings.dailyPlayed);
  return startGame(MODE.DAILY);
};

const tapOver = (x, y) => {
  if (ui.overT < OVER_INPUT_DELAY) return undefined;
  const revivable = canRevive(game);
  const daily = game.mode === MODE.DAILY;
  if (revivable && inRect(OVER.primary, x, y)) { press('revive'); return reviveWithAd(); }
  const againRect = revivable ? OVER.secondary : OVER.primary;
  if (!daily && inRect(againRect, x, y)) { press('again'); return startGame(MODE.RUN); }
  if (inRect(OVER.home, x, y)) { press('home'); return goHome(); }
  return undefined;
};

const pickCard = (index) => {
  press(`card:${index}`);
  applyResult(answer(game, index));
};

const handleDown = (x, y) => {
  synth.unlock();
  if (!running || busy || ui.muted) return;
  if (!inGame()) {
    tapHome(x, y);
    return;
  }
  if (ui.needTap) {
    if (ui.tapAt < 0) ui = { ...ui, tapAt: ui.time };
    return;
  }
  if (game.phase === PHASE.OVER) {
    tapOver(x, y);
    return;
  }
  if (game.phase !== PHASE.ASK) return;
  const index = CARDS.findIndex((card) => inRect(card, x, y));
  if (index >= 0) pickCard(index);
};

const handleKey = (event) => {
  if (event.repeat || !running || busy || ui.muted) return;
  synth.unlock();
  const card = CARD_KEYS.indexOf(event.code);
  if (inGame() && game.phase === PHASE.ASK && card >= 0) {
    event.preventDefault();
    pickCard(card);
  } else if (!inGame() && (event.code === 'Space' || event.code === 'Enter')) {
    event.preventDefault();
    startGame(MODE.RUN);
  }
};

const bindInput = () => {
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const { x, y } = toDesign(event.clientX, event.clientY);
    handleDown(x, y);
  });
  window.addEventListener('keydown', handleKey);
};

// Pausa e retomada so pelo SDK: o YouTube proibe usar a Page Visibility API para isso.
const bindPlatform = () => {
  platform.onAudioEnabledChange((isEnabled) => {
    synth.setEnabled(isEnabled);
    ui = { ...ui, muted: !isEnabled };
    // O som voltou: o trecho interrompido recomeca do inicio; o tempo de resposta continua de onde parou.
    if (isEnabled && inGame()) {
      game = restartLine(game);
      playLine();
    }
    if (booted && !running) drawFrame();
  });
  platform.onPause(() => {
    paused = true;
    stopLoop();
    // Corta o som (inclusive notas ja agendadas). Com o laco parado, o tempo da rodada congela.
    synth.suspend();
    persist();
  });
  platform.onResume(() => {
    paused = false;
    synth.resume();
    if (inGame()) {
      game = restartLine(game);
      playLine();
    }
    if (booted) startLoop();
  });
};

const boot = async () => {
  // Ouvir o tamanho desde o comeco: o YouTube pode redimensionar o jogo durante o carregamento.
  window.addEventListener('resize', resize);
  // Soltar o dedo conta como gesto do jogador em todo navegador, o toque inicial nem sempre.
  window.addEventListener('pointerup', () => synth.unlock());
  resize();
  drawLoading(ctx, view, strings);
  platform.firstFrameReady();
  // Registrar antes de carregar: a pausa pode chegar durante o carregamento.
  bindPlatform();

  const [raw, locale] = await Promise.all([platform.loadData(), platform.getLanguage()]);
  save = parseSave(raw);
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
