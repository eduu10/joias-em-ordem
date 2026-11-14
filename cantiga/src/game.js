// Logica pura do jogo: recebe estado, devolve estado novo e eventos. Nunca altera o que recebe.
// O sorteio usa o `rng` injetado (createRng), entao a mesma semente gera a mesma partida.
import { CONFIG, MODE, PHASE } from './config.js';
import { SONGS, songById } from './songs.js';
import { createRng, shuffled } from './rng.js';

export const EVENT = Object.freeze({
  ROUND_START: 'roundStart',
  STOP: 'stop',
  ANSWER: 'answer',
  TIMEOUT: 'timeout',
  LEVEL_UP: 'levelUp',
  RUN_END: 'runEnd',
});

export const levelFor = (correct) => 1 + Math.floor(correct / CONFIG.roundsPerLevel);
export const poolSize = (level) => CONFIG.poolByLevel[Math.min(level, CONFIG.poolByLevel.length) - 1];
export const answerSecondsFor = (level) =>
  Math.max(CONFIG.answerSecondsMin, CONFIG.answerSeconds - (level - 1) * CONFIG.answerSecondsPerLevel);
export const streakMultiplier = (streak) => 1 + Math.min(Math.max(0, streak - 1), CONFIG.streakMaxSteps) * CONFIG.streakStep;

// Pontos pela rapidez: tudo no primeiro instante, o minimo no ultimo.
export const speedPoints = (elapsed, limit) => {
  const left = Math.min(1, Math.max(0, 1 - elapsed / limit));
  return Math.round(CONFIG.minPoints + (CONFIG.maxPoints - CONFIG.minPoints) * left);
};

// Quatro opcoes distintas, uma delas certa, em ordem sorteada.
export const buildQuestion = (song, stopIndex, rng) => {
  const stop = song.stops[stopIndex];
  const answer = song.words[stop.word].label;
  const seen = new Set([answer.toLowerCase()]);
  const wrong = stop.wrong.filter((word) => {
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, CONFIG.options - 1);
  const options = shuffled([answer, ...wrong], rng);
  return { options, correct: options.indexOf(answer), answer };
};

// Proxima cantiga sem repetir ate usar todas as liberadas. Devolve { songId, used }.
export const pickSong = (used, level, rng, last = null) => {
  const pool = SONGS.slice(0, poolSize(level)).map((song) => song.id);
  let fresh = pool.filter((id) => !used.includes(id));
  let nextUsed = used;
  if (fresh.length === 0) {
    nextUsed = [];
    fresh = pool.filter((id) => id !== last);
  }
  const songId = fresh[Math.floor(rng() * fresh.length)];
  return { songId, used: [...nextUsed, songId] };
};

const makeRound = (songId, stopIndex, level, rng) => {
  const song = songById(songId);
  const question = buildQuestion(song, stopIndex, rng);
  const stopWord = song.words[song.stops[stopIndex].word];
  return {
    songId,
    stopIndex,
    word: song.stops[stopIndex].word,
    options: question.options,
    correct: question.correct,
    listenSeconds: stopWord.start,
    answerSeconds: answerSecondsFor(level),
    picked: -1,
    right: false,
    points: 0,
  };
};

// Hash simples de texto para semente (FNV-1a).
const hashText = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Desafio do dia: as mesmas 5 cantigas (e os mesmos trechos) para todo mundo na mesma data.
export const dailySet = (dateKey) => {
  const rng = createRng(hashText(`cantiga:${dateKey}`));
  return shuffled(SONGS.map((song) => song.id), rng).slice(0, CONFIG.dailyRounds).map((songId) => ({
    songId, stopIndex: Math.floor(rng() * songById(songId).stops.length),
  }));
};

export const dateKeyOf = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const startRound = (state, rng) => {
  const round = state.mode === MODE.DAILY ? state.daily[state.roundNo] : null;
  let used = state.used;
  let songId;
  let stopIndex;
  if (round) {
    ({ songId, stopIndex } = round);
  } else {
    ({ songId, used } = pickSong(state.used, state.level, rng, state.round?.songId ?? null));
    stopIndex = Math.floor(rng() * songById(songId).stops.length);
  }
  const level = state.mode === MODE.DAILY ? 1 : state.level;
  return {
    state: { ...state, used, phase: PHASE.LISTEN, t: 0, round: makeRound(songId, stopIndex, level, rng) },
    events: [{ type: EVENT.ROUND_START, songId }],
  };
};

// `options`: { mode, dateKey }
export const createGame = (options, rng) => {
  const mode = options.mode === MODE.DAILY ? MODE.DAILY : MODE.RUN;
  const base = {
    mode,
    dateKey: options.dateKey ?? '',
    daily: mode === MODE.DAILY ? dailySet(options.dateKey ?? '') : null,
    lives: CONFIG.lives,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    level: 1,
    roundNo: 0,
    used: [],
    revived: false,
    phase: PHASE.LISTEN,
    t: 0,
    round: null,
  };
  return startRound(base, rng);
};

// Volta a cantar o trecho do comeco (depois de pausa ou de o som voltar). O tempo de resposta nao muda.
export const restartLine = (state) => (state.phase === PHASE.LISTEN ? { ...state, t: 0 } : state);

const settle = (state, picked) => {
  const { round } = state;
  const right = picked === round.correct;
  const points = right ? Math.round(speedPoints(state.t, round.answerSeconds) * streakMultiplier(state.streak + 1)) : 0;
  const streak = right ? state.streak + 1 : 0;
  const correctCount = state.correctCount + (right ? 1 : 0);
  const level = state.mode === MODE.DAILY ? 1 : levelFor(correctCount);
  const next = {
    ...state,
    phase: PHASE.REVEAL,
    t: 0,
    lives: right ? state.lives : state.lives - 1,
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    correctCount,
    level,
    round: { ...round, picked, right, points },
  };
  const events = [picked < 0
    ? { type: EVENT.TIMEOUT, correct: round.correct }
    : { type: EVENT.ANSWER, right, points, picked, correct: round.correct, streak }];
  if (level > state.level) events.push({ type: EVENT.LEVEL_UP, level });
  return { state: next, events };
};

export const answer = (state, index) => {
  if (state.phase !== PHASE.ASK || !Number.isInteger(index) || index < 0 || index >= state.round.options.length) {
    return { state, events: [] };
  }
  return settle(state, index);
};

const finishReveal = (state, rng) => {
  const roundNo = state.roundNo + 1;
  const dailyDone = state.mode === MODE.DAILY && roundNo >= CONFIG.dailyRounds;
  if (state.lives <= 0 || dailyDone) {
    return { state: { ...state, roundNo, phase: PHASE.OVER, t: 0 }, events: [{ type: EVENT.RUN_END, score: state.score }] };
  }
  return startRound({ ...state, roundNo }, rng);
};

const revealSeconds = (state) => (state.round.right ? CONFIG.revealRightSeconds : CONFIG.revealWrongSeconds);

// `dt` em segundos de tempo real.
export const step = (state, dt, rng) => {
  const t = state.t + Math.max(0, dt);
  switch (state.phase) {
    case PHASE.LISTEN:
      if (t >= CONFIG.introSeconds + state.round.listenSeconds) {
        return { state: { ...state, phase: PHASE.ASK, t: 0 }, events: [{ type: EVENT.STOP }] };
      }
      return { state: { ...state, t }, events: [] };
    case PHASE.ASK:
      if (t >= state.round.answerSeconds) return settle({ ...state, t: state.round.answerSeconds }, -1);
      return { state: { ...state, t }, events: [] };
    case PHASE.REVEAL:
      if (t >= revealSeconds(state)) return finishReveal(state, rng);
      return { state: { ...state, t }, events: [] };
    default:
      return { state, events: [] };
  }
};

export const canRevive = (state) => state.phase === PHASE.OVER && state.mode === MODE.RUN && !state.revived && state.lives <= 0;

// Continua a partida com 1 vida (so uma vez por partida, depois do anuncio com recompensa).
export const revive = (state, rng) => {
  if (!canRevive(state)) return { state, events: [] };
  return startRound({ ...state, lives: 1, revived: true, streak: 0 }, rng);
};
