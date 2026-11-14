// Ponto de entrada: liga a logica do quiz, o desenho, o sintetizador e o SDK do YouTube Playables.
import {
  CONFIG, DESIGN, OUTCOME, PHASE, REWARD_ID_HOME_COINS, REWARD_ID_REMATCH, SCREEN, SHOP_ITEMS,
} from './config.js';
import { EVENT, answer, createMatch, currentQuestion, currentTune, step } from './quiz.js';
import { applyMatch, buyItem, claimHomeAd, createProfile, instrumentOverride, isOwned, levelInfo, toggleEquip } from './profile.js';
import { parseSave, serializeSave } from './save.js';
import { stringsFor } from './strings.js';
import { platform } from './platform.js';
import { createRng } from './rng.js';
import { createSynth } from './synth.js';
import { confetti, floatText, sparks, stepFx } from './fx.js';
import { MATCH, SHOP } from './layout.js';
import { TOAST_SECONDS, drawLoading, drawScene } from './scene.js';
import { tapTarget } from './taps.js';
import { heldClock, tickClock } from './round-clock.js';

const MAX_PIXEL_RATIO = 2;
const EQ_BARS = 16;
const EQ_GAIN = 1.7;
const EQ_FALL = 2.6;
const PRESS_SECONDS = 0.16;
const SPIN_PLAY = 2.6;
const SPIN_IDLE = 0.7;
const CARD_KEYS = Object.freeze(['Digit1', 'Digit2', 'Digit3', 'Digit4']);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const synth = createSynth(platform.isAudioEnabled());

let strings = stringsFor(navigator.language);
let view = { width: 0, height: 0, ratio: 1, scale: 1, ox: 0, oy: 0 };
let profile = createProfile();
let match = null;
let ui = {
  screen: SCREEN.HOME, screenT: 0, time: 0, spin: 0, energy: 0, eq: Array(EQ_BARS).fill(0), fx: [], press: null,
  toast: null, summary: null, popPlayer: 0, popRival: 0, coinPop: 0, needTap: false, muted: !platform.isAudioEnabled(),
  noAudio: false,
};
let interstitialDue = false;
let matchSeed = 0;
let busy = false;
let running = false;
let paused = false;
let booted = false;
let frameId = 0;
let lastTime = 0;
let roundClock = heldClock();

const persist = () => platform.saveData(serializeSave(profile));
const addFx = (...items) => { ui = { ...ui, fx: [...ui.fx, ...items.flat()] }; };
const toast = (text) => { ui = { ...ui, toast: { text, t: 0 } }; };
const goTo = (screen) => { ui = { ...ui, screen, screenT: 0, press: null }; };
const drawFrame = () => drawScene(ctx, { profile, match, view, strings, ui });

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

const toDesign = (clientX, clientY) => ({
  x: (clientX - view.ox) / view.scale,
  y: (clientY - view.oy) / view.scale,
});

// A melodia da rodada, sempre do comeco. O timbre comprado na lojinha troca so o som, nao as notas.
const playRoundTune = () => {
  const tune = currentTune(match);
  if (!tune || ui.muted || paused) return;
  synth.playTune({
    notes: tune.notes, tempo: tune.tempo, preset: instrumentOverride(profile) ?? tune.preset, gapBeats: CONFIG.tuneGapBeats,
  });
};

const finishMatch = () => {
  const result = applyMatch(profile, match);
  profile = result.profile;
  ui = { ...ui, summary: result.summary, fx: [] };
  goTo(SCREEN.RESULT);
  if (result.summary.outcome === OUTCOME.WIN) addFx(confetti(90, DESIGN.w));
  synth.playSound(result.summary.outcome);
  interstitialDue = profile.matches % CONFIG.interstitialEveryMatches === 0;
  persist();
  platform.sendScore(profile.best);
};

const onRoundEnd = (event) => {
  synth.stopTune();
  synth.playSound(event.type === EVENT.TIMEOUT ? 'timeout' : event.correct ? 'correct' : 'wrong');
  ui = { ...ui, popPlayer: event.points > 0 ? 1 : 0, popRival: event.rivalPoints > 0 ? 1 : 0 };
  if (!event.correct) return;
  const card = MATCH.cards[currentQuestion(match).options.indexOf(event.tuneId)];
  addFx(sparks(card.x + card.w / 2, card.y + card.h / 2, 138, 22, 1.3), floatText(card.x + card.w / 2, card.y - 6, `+${event.points}`, '#b6ffcb', 26));
};

const onEvent = (event) => {
  switch (event.type) {
    case EVENT.ROUND_START:
      playRoundTune();
      break;
    case EVENT.RIVAL_ANSWER:
      synth.playSound('rival');
      break;
    case EVENT.ANSWER:
    case EVENT.TIMEOUT:
      onRoundEnd(event);
      break;
    case EVENT.MATCH_END:
      finishMatch();
      break;
    default:
  }
};

const applyStep = (result) => {
  match = result.state;
  result.events.forEach(onEvent);
};

// Navegador sem WebAudio: a rodada nunca teria som, entao mostra o aviso em vez de esperar para sempre.
const showNoAudio = () => {
  synth.stopTune();
  roundClock = heldClock();
  ui = { ...ui, noAudio: true, needTap: false, press: null };
};

// Segundos reais desde o ultimo quadro: pelo relogio do audio quando o som esta rodando (anda junto com a
// melodia e para sozinho em pausa e no mudo), senao pelo relogio da pagina.
const matchSeconds = () => {
  const audio = synth.clock();
  const tick = audio === null
    ? tickClock(roundClock, 'page', performance.now() / 1000)
    : tickClock(roundClock, 'audio', audio);
  roundClock = tick.clock;
  return tick.dt;
};

// A partida so anda com o som ligado e tocando: sem ouvir a melodia nao da para responder.
const updateMatch = () => {
  if (ui.screen !== SCREEN.MATCH || !match || ui.muted || ui.noAudio) {
    roundClock = heldClock();
    return;
  }
  if (match.phase === PHASE.PLAY && !synth.isSupported()) {
    showNoAudio();
    return;
  }
  const needTap = match.phase === PHASE.PLAY && !synth.isReady();
  ui = { ...ui, needTap };
  if (needTap) {
    roundClock = heldClock();
    return;
  }
  const fresh = roundClock.last === null;
  if (match.phase === PHASE.READY && match.t === 0 && fresh) synth.playSound('ready');
  applyStep(step(match, matchSeconds()));
};

const fade = (value, dt, perSecond) => Math.max(0, value - dt * perSecond);
const advance = (value, dt, limit) => (value && value.t + dt < limit ? { ...value, t: value.t + dt } : null);

const update = (dt) => {
  const levels = synth.levels();
  const eq = ui.eq.map((value, index) => Math.max(Math.min(1, (levels[index] ?? 0) * EQ_GAIN), value - dt * EQ_FALL));
  const hearing = ui.screen === SCREEN.MATCH && match?.phase === PHASE.PLAY && !ui.muted && !ui.needTap;
  ui = {
    ...ui,
    time: ui.time + dt,
    screenT: ui.screenT + dt,
    spin: ui.spin + dt * (hearing ? SPIN_PLAY : ui.screen === SCREEN.HOME ? SPIN_IDLE : 0),
    eq,
    energy: eq.reduce((sum, value) => sum + value, 0) / EQ_BARS,
    fx: stepFx(ui.fx, dt),
    press: advance(ui.press, dt, PRESS_SECONDS),
    toast: advance(ui.toast, dt, TOAST_SECONDS),
    popPlayer: fade(ui.popPlayer, dt, 2.2),
    popRival: fade(ui.popRival, dt, 2.2),
    coinPop: fade(ui.coinPop, dt, 4),
  };
  updateMatch();
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

// Anuncio entre partidas: so na troca de tela depois do resultado, nunca no meio de uma rodada.
const startMatch = async (category, double) => {
  if (!synth.isSupported()) {
    showNoAudio();
    return;
  }
  if (interstitialDue) {
    interstitialDue = false;
    busy = true;
    await platform.showInterstitial().finally(() => { busy = false; });
  }
  matchSeed = (matchSeed + Date.now() + profile.matches * 7919) >>> 0;
  match = createMatch(
    { category, level: levelInfo(profile.xp).level, recent: profile.recent, double }, createRng(matchSeed),
  );
  roundClock = heldClock();
  ui = { ...ui, fx: [], summary: null, popPlayer: 0, popRival: 0, needTap: false };
  goTo(SCREEN.MATCH);
};

// Os anuncios com recompensa so abrem depois de o jogador tocar no botao que diz isso.
const rematchWithAd = async () => {
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_REMATCH).finally(() => { busy = false; });
  if (!earned) return toast(strings.adUnavailable);
  // Quem acabou de ver um anuncio para a revanche nao leva outro logo em seguida.
  interstitialDue = false;
  return startMatch(match.category, true);
};

const homeBonusWithAd = async () => {
  busy = true;
  const earned = await platform.showRewarded(REWARD_ID_HOME_COINS).finally(() => { busy = false; });
  if (!earned) return toast(strings.adUnavailable);
  profile = claimHomeAd(profile);
  ui = { ...ui, coinPop: 1 };
  toast(`${strings.adBonus} +${CONFIG.homeAdCoins}`);
  synth.playSound('coin');
  return persist();
};

const tapShopItem = (id) => {
  if (isOwned(profile, id)) {
    profile = toggleEquip(profile, id);
    synth.playSound('tap');
    return persist();
  }
  const result = buyItem(profile, id);
  if (!result.bought) {
    synth.playSound('deny');
    return toast(strings.notEnough);
  }
  profile = result.profile;
  const row = SHOP.rows[SHOP_ITEMS.findIndex((item) => item.id === id)];
  addFx(sparks(row.x + 44, row.y + row.h / 2, 48, 18));
  ui = { ...ui, coinPop: 1 };
  toast(strings.bought);
  synth.playSound('coin');
  return persist();
};

const act = (key) => {
  const [kind, value] = key.split(':');
  if (kind === 'card') return applyStep(answer(match, currentQuestion(match).options[Number(value)]));
  synth.playSound('tap');
  if (kind === 'noAudioHome') {
    ui = { ...ui, noAudio: false };
    return goTo(SCREEN.HOME);
  }
  if (kind === 'play') return goTo(SCREEN.CATEGORY);
  if (kind === 'shop') return goTo(SCREEN.SHOP);
  if (kind === 'back' || kind === 'home') return goTo(SCREEN.HOME);
  if (kind === 'cat') return startMatch(value, false);
  if (kind === 'playAgain') return startMatch(match.category, false);
  if (kind === 'rematchAd') return rematchWithAd();
  if (kind === 'homeAd') return homeBonusWithAd();
  return tapShopItem(value);
};

const handleDown = (x, y) => {
  if (!running || busy || ui.muted) return;
  // Um toque que so serviu para destravar o audio nao pode responder a rodada sem o jogador ouvir nada.
  const wasDeaf = ui.screen === SCREEN.MATCH && !ui.noAudio && !synth.isReady();
  synth.unlock();
  if (wasDeaf) return;
  const key = tapTarget({ profile, match, ui }, x, y);
  if (!key) return;
  ui = { ...ui, press: { key, t: 0 } };
  act(key);
};

const handleKey = (event) => {
  if (event.repeat || !running || busy || ui.muted) return;
  synth.unlock();
  const card = CARD_KEYS.indexOf(event.code);
  if (ui.noAudio) {
    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'Escape') {
      event.preventDefault();
      act('noAudioHome');
    }
  } else if (ui.screen === SCREEN.MATCH && match?.phase === PHASE.PLAY && card >= 0 && synth.isReady()) {
    event.preventDefault();
    ui = { ...ui, press: { key: `card:${card}`, t: 0 } };
    act(`card:${card}`);
  } else if (ui.screen === SCREEN.HOME && (event.code === 'Space' || event.code === 'Enter')) {
    event.preventDefault();
    act('play');
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
    // O som voltou: a melodia interrompida recomeca do inicio e o tempo da rodada continua de onde parou.
    if (isEnabled && match?.phase === PHASE.PLAY && ui.screen === SCREEN.MATCH) playRoundTune();
    if (booted && !running) drawFrame();
  });
  platform.onPause(() => {
    paused = true;
    stopLoop();
    // O tempo da rodada congela: na volta o relogio recomeca do zero, sem contar o tempo em pausa.
    roundClock = heldClock();
    ui = { ...ui, press: null };
    // Corta a melodia (inclusive as notas ja agendadas). Com o laco parado, o tempo da rodada congela.
    synth.suspend();
    persist();
  });
  platform.onResume(() => {
    paused = false;
    roundClock = heldClock();
    synth.resume();
    if (match?.phase === PHASE.PLAY && ui.screen === SCREEN.MATCH) playRoundTune();
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
  profile = parseSave(raw);
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
