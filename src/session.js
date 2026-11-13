// Estado de uma partida e as acoes do jogador. Cada acao devolve um estado novo e o que aconteceu.
import { CONFIG, PHASE } from './config.js';
import { applyMove, canMove, isJarDone, isSolved, topOf } from './puzzle.js';

export const EVENT = Object.freeze({
  NONE: 'none',
  SELECT: 'select',
  DESELECT: 'deselect',
  MOVE: 'move',
});

const nothing = (session) => ({ session, event: { type: EVENT.NONE } });

export const createSession = (level, jars, capacity) => ({
  level,
  capacity,
  initial: jars,
  jars,
  history: [],
  moves: 0,
  selected: null,
  phase: PHASE.PLAYING,
});

const selectable = (session, index) => {
  const jar = session.jars[index];
  return Boolean(jar) && jar.length > 0 && !isJarDone(jar, session.capacity);
};

const moveGem = (session, from, to) => {
  const jars = applyMove(session.jars, from, to);
  const won = isSolved(jars, session.capacity);
  const next = {
    ...session,
    jars,
    history: [...session.history, session.jars].slice(-CONFIG.undoLimit),
    moves: session.moves + 1,
    selected: null,
    phase: won ? PHASE.WON : PHASE.PLAYING,
  };
  const event = {
    type: EVENT.MOVE,
    from,
    to,
    color: topOf(session.jars[from]),
    fromSlot: session.jars[from].length - 1,
    toSlot: jars[to].length - 1,
    jarDone: isJarDone(jars[to], session.capacity),
    won,
  };
  return { session: next, event };
};

export const tapJar = (session, index) => {
  if (session.phase !== PHASE.PLAYING || !session.jars[index]) return nothing(session);
  const { selected } = session;
  if (selected === index) {
    return { session: { ...session, selected: null }, event: { type: EVENT.DESELECT } };
  }
  if (selected !== null && canMove(session.jars, selected, index, session.capacity)) {
    return moveGem(session, selected, index);
  }
  if (selectable(session, index)) {
    return { session: { ...session, selected: index }, event: { type: EVENT.SELECT, jar: index } };
  }
  return nothing(session);
};

export const clearSelection = (session) =>
  session.selected === null ? session : { ...session, selected: null };

export const undo = (session) => {
  if (session.phase !== PHASE.PLAYING || session.history.length === 0) return session;
  return {
    ...session,
    jars: session.history[session.history.length - 1],
    history: session.history.slice(0, -1),
    moves: session.moves + 1,
    selected: null,
  };
};

export const restart = (session) => createSession(session.level, session.initial, session.capacity);
