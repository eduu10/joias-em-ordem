// Logica da partida. Funcoes puras: recebem um estado e devolvem um novo, mais a lista do que aconteceu.
// O acaso vem sempre de um gerador com semente passado por quem chama (ver rng.js).
import { CONFIG, PHASE } from './config.js';
import { shuffled } from './rng.js';
import { tuneById, tunesIn } from './tunes.js';

export const EVENT = Object.freeze({
  ROUND_START: 'roundStart', RIVAL_ANSWER: 'rivalAnswer', ANSWER: 'answer', TIMEOUT: 'timeout', MATCH_END: 'matchEnd',
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Acertar vale ate 100 pontos, proporcional ao tempo que sobrou. Errar ou deixar o tempo acabar vale zero.
export const pointsFor = (correct, timeLeft) => {
  if (!correct || !(timeLeft > 0)) return 0;
  const share = clamp(timeLeft / CONFIG.roundSeconds, 0, 1);
  return Math.max(CONFIG.minCorrectPoints, Math.round(CONFIG.maxPoints * share));
};

// O rival e simulado pelo jogo. Quanto maior o nivel do jogador, mais ele acerta e mais rapido responde.
export const rivalSkill = (level) => {
  const steps = Math.max(0, Math.floor(Number(level) || 1) - 1);
  return {
    accuracy: Math.min(CONFIG.rivalAccuracyMax, CONFIG.rivalAccuracyBase + CONFIG.rivalAccuracyPerLevel * steps),
    delayMin: Math.max(CONFIG.rivalDelayFloorMin, CONFIG.rivalDelayMin - CONFIG.rivalDelayPerLevel * steps),
    delayMax: Math.max(CONFIG.rivalDelayFloorMax, CONFIG.rivalDelayMax - CONFIG.rivalDelayPerLevel * steps),
  };
};

// Escolhe as melodias da partida, sem repetir. Prefere as que o jogador nao ouviu ha pouco tempo;
// se faltar, completa com as ouvidas ha mais tempo.
export const pickTunes = (category, recent, rng, count = CONFIG.rounds) => {
  const pool = tunesIn(category);
  const fresh = shuffled(pool.filter((tune) => !recent.includes(tune.id)), rng);
  const stale = pool
    .filter((tune) => recent.includes(tune.id))
    .sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  return [...fresh, ...stale].slice(0, count);
};

// Uma pergunta: a melodia certa e mais tres titulos da mesma categoria, em ordem embaralhada.
export const buildQuestion = (tune, rng) => {
  const sameCategory = tunesIn(tune.category).filter((other) => other.id !== tune.id);
  const others = tunesIn('mix').filter((other) => other.id !== tune.id && other.category !== tune.category);
  const wrong = [...shuffled(sameCategory, rng), ...shuffled(others, rng)].slice(0, CONFIG.options - 1);
  return { tuneId: tune.id, options: shuffled([tune.id, ...wrong.map((other) => other.id)], rng) };
};

const planRival = (skill, rng) => ({
  rivalCorrect: rng() < skill.accuracy,
  rivalDelay: skill.delayMin + rng() * (skill.delayMax - skill.delayMin),
});

/**
 * @param {{category: string, level?: number, recent?: string[], double?: boolean}} setup
 * @param {() => number} rng gerador com semente
 */
export const createMatch = (setup, rng) => {
  const skill = rivalSkill(setup.level ?? 1);
  const questions = pickTunes(setup.category, setup.recent ?? [], rng)
    .map((tune) => ({ ...buildQuestion(tune, rng), ...planRival(skill, rng) }));
  return {
    category: setup.category,
    double: Boolean(setup.double),
    questions,
    round: 0,
    phase: PHASE.READY,
    t: 0,
    timeLeft: CONFIG.roundSeconds,
    pick: null,
    rivalAnswered: false,
    playerScore: 0,
    rivalScore: 0,
    history: [],
  };
};

export const currentQuestion = (match) => match.questions[match.round] ?? null;
export const currentTune = (match) => tuneById(currentQuestion(match)?.tuneId);
export const heardTuneIds = (match) => match.history.map((entry) => entry.tuneId);

// Fecha a rodada: `pick` e o titulo escolhido ou null se o tempo acabou.
const resolveRound = (match, pick, events) => {
  const question = currentQuestion(match);
  const correct = pick === question.tuneId;
  const points = pointsFor(correct, match.timeLeft);
  const rivalPoints = pointsFor(question.rivalCorrect, CONFIG.roundSeconds - question.rivalDelay);
  const entry = { tuneId: question.tuneId, pick, correct, points, rivalCorrect: question.rivalCorrect, rivalPoints };
  events.push({ type: pick === null ? EVENT.TIMEOUT : EVENT.ANSWER, ...entry });
  return {
    ...match,
    phase: PHASE.FEEDBACK,
    t: 0,
    pick,
    playerScore: match.playerScore + points,
    rivalScore: match.rivalScore + rivalPoints,
    history: [...match.history, entry],
  };
};

// O jogador tocou num cartao. So vale durante a rodada e para um titulo que esta na tela.
export const answer = (match, optionId) => {
  const question = currentQuestion(match);
  if (match.phase !== PHASE.PLAY || !question || !question.options.includes(optionId)) {
    return { state: match, events: [] };
  }
  const events = [];
  return { state: resolveRound(match, optionId, events), events };
};

const stepReady = (match, dt, events) => {
  const t = match.t + dt;
  if (t < CONFIG.readySeconds) return { ...match, t };
  events.push({ type: EVENT.ROUND_START, round: match.round, tuneId: currentQuestion(match).tuneId });
  return { ...match, phase: PHASE.PLAY, t: 0, timeLeft: CONFIG.roundSeconds, pick: null, rivalAnswered: false };
};

const stepPlay = (match, dt, events) => {
  const timeLeft = Math.max(0, match.timeLeft - dt);
  const elapsed = CONFIG.roundSeconds - timeLeft;
  const rivalNow = !match.rivalAnswered && elapsed >= currentQuestion(match).rivalDelay;
  if (rivalNow) events.push({ type: EVENT.RIVAL_ANSWER, round: match.round });
  const next = { ...match, t: match.t + dt, timeLeft, rivalAnswered: match.rivalAnswered || rivalNow };
  return timeLeft > 0 ? next : resolveRound(next, null, events);
};

const stepFeedback = (match, dt, events) => {
  const t = match.t + dt;
  if (t < CONFIG.feedbackSeconds) return { ...match, t };
  if (match.round + 1 >= match.questions.length) {
    events.push({ type: EVENT.MATCH_END, playerScore: match.playerScore, rivalScore: match.rivalScore });
    return { ...match, phase: PHASE.DONE, t: 0 };
  }
  return { ...match, phase: PHASE.READY, t: 0, round: match.round + 1, pick: null, rivalAnswered: false };
};

/**
 * @param {object} match estado atual da partida
 * @param {number} dt segundos desde o ultimo passo
 * @returns {{state: object, events: object[]}}
 */
export const step = (match, dt) => {
  const events = [];
  if (match.phase === PHASE.READY) return { state: stepReady(match, dt, events), events };
  if (match.phase === PHASE.PLAY) return { state: stepPlay(match, dt, events), events };
  if (match.phase === PHASE.FEEDBACK) return { state: stepFeedback(match, dt, events), events };
  return { state: match, events };
};
