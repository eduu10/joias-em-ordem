import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, MODE, PHASE } from '../cantiga/src/config.js';
import { SONGS, isSongId, playbackNotes } from '../cantiga/src/songs.js';
import {
  EVENT, answer, answerSecondsFor, buildQuestion, canRevive, createGame, dailySet, pickSong, poolSize,
  restartLine, revive, speedPoints, step, streakMultiplier,
} from '../cantiga/src/game.js';
import { applyRun, emptySave, parseSave, serializeSave } from '../cantiga/src/save.js';
import { createRng } from '../cantiga/src/rng.js';

const MIN_MIDI = 48;
const MAX_MIDI = 84;

// Avanca ate a fase pedida (ou ate o limite de tempo).
const runUntil = (state, phase, rng, dt = 0.1) => {
  let current = state;
  for (let i = 0; i < 2000 && current.phase !== phase; i += 1) current = step(current, dt, rng).state;
  return current;
};

const startRun = (seed = 1) => {
  const rng = createRng(seed);
  return { rng, state: createGame({ mode: MODE.RUN }, rng).state };
};

test('toda cantiga esta bem formada', () => {
  assert.ok(SONGS.length >= 15, `so ${SONGS.length} cantigas`);
  assert.equal(SONGS.length, CONFIG.poolByLevel.at(-1));
  assert.equal(new Set(SONGS.map((song) => song.id)).size, SONGS.length);
  SONGS.forEach((song) => {
    assert.ok(song.title && song.source, song.id);
    assert.ok(song.notes.length >= 10, `${song.id}: poucas notas`);
    assert.ok(song.seconds >= 5 && song.seconds <= 20, `${song.id}: ${song.seconds.toFixed(1)} s`);
    song.notes.forEach((note, i) => {
      assert.ok(note.midi >= MIN_MIDI && note.midi <= MAX_MIDI, `${song.id} nota ${i}`);
      assert.ok(note.beats > 0 && note.seconds > 0, `${song.id} duracao ${i}`);
      assert.ok(typeof note.syl === 'string' && note.syl.trim().length > 0, `${song.id} silaba ${i}`);
    });
    // Fronteiras de palavra: cada palavra comeca e termina uma vez, em ordem, sem buracos.
    song.words.forEach((word, w) => {
      assert.ok(song.notes[word.first].wordStart && song.notes[word.last].wordEnd, `${song.id} palavra ${w}`);
      for (let i = word.first; i <= word.last; i += 1) assert.equal(song.notes[i].word, w);
      if (w > 0) assert.equal(word.first, song.words[w - 1].last + 1);
      assert.ok(word.label.length > 0);
    });
    assert.equal(song.words.at(-1).last, song.notes.length - 1);
    assert.ok(song.stops.length >= 2 && song.stops.length <= 4, `${song.id}: pontos de parada`);
    song.stops.forEach((stop) => {
      assert.ok(Number.isInteger(stop.word) && stop.word > 0 && stop.word < song.words.length, `${song.id} parada ${stop.word}`);
    });
  });
});

test('melodias conferidas: fonte com partitura, sem as cantigas sem partitura confiavel', () => {
  SONGS.forEach((song) => assert.match(song.source, /^https:\/\/www\.bethsnotesplus\.com\/\d{4}\/\d{2}\/[a-z-]+\.html/, song.id));
  ['marcha', 'peixe'].forEach((id) => assert.equal(isSongId(id), false));
});

test('pausas: tempo de inicio conta o silencio e o sintetizador recebe a pausa', () => {
  SONGS.forEach((song) => {
    song.notes.forEach((note, i) => {
      if (i === 0) return;
      const prev = song.notes[i - 1];
      const expected = prev.start + prev.seconds + (note.restBefore * 60) / song.tempo;
      assert.ok(Math.abs(note.start - expected) < 1e-9, `${song.id} nota ${i}`);
    });
    const all = playbackNotes(song, 0, song.notes.length - 1);
    const beats = all.reduce((sum, n) => sum + n.beats, 0);
    const restBeats = song.notes.slice(1).reduce((sum, n) => sum + n.restBefore, 0);
    assert.ok(Math.abs(beats - (song.notes.reduce((sum, n) => sum + n.beats, 0) + restBeats)) < 1e-9);
    assert.equal(all.filter((n) => n.midi !== null).length, song.notes.length);
  });
  const balao = SONGS.find((song) => song.id === 'balao');
  assert.ok(balao.notes.some((note) => note.restBefore > 0));
});

test('palavras erradas: 3 distintas e diferentes da certa', () => {
  SONGS.forEach((song) => song.stops.forEach((stop) => {
    const right = song.words[stop.word].label.toLowerCase();
    const wrong = stop.wrong.map((word) => word.toLowerCase());
    assert.equal(wrong.length, 3, song.id);
    assert.equal(new Set(wrong).size, 3, song.id);
    assert.ok(!wrong.includes(right), `${song.id}: ${right}`);
    wrong.forEach((word) => assert.ok(word.trim().length > 0));
  }));
});

test('pergunta sempre tem 4 opcoes distintas com a certa', () => {
  const rng = createRng(9);
  SONGS.forEach((song) => song.stops.forEach((stop, index) => {
    for (let k = 0; k < 10; k += 1) {
      const q = buildQuestion(song, index, rng);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map((o) => o.toLowerCase())).size, 4);
      assert.equal(q.options[q.correct], song.words[stop.word].label);
    }
  }));
});

test('nenhuma cantiga repete antes de usar todas as liberadas', () => {
  const rng = createRng(3);
  [1, 2, 3, 4, 9].forEach((level) => {
    const size = poolSize(level);
    let used = [];
    let last = null;
    for (let cycle = 0; cycle < 5; cycle += 1) {
      const seen = new Set();
      for (let i = 0; i < size; i += 1) {
        const pick = pickSong(used, level, rng, last);
        assert.ok(!seen.has(pick.songId), `repetiu ${pick.songId}`);
        if (i === 0 && cycle > 0) assert.notEqual(pick.songId, last);
        seen.add(pick.songId);
        used = pick.used;
        last = pick.songId;
      }
      assert.equal(seen.size, size);
    }
  });
});

test('desafio do dia e igual para a mesma data e muda entre datas', () => {
  const a = dailySet('2026-11-14');
  assert.deepEqual(a, dailySet('2026-11-14'));
  assert.equal(a.length, CONFIG.dailyRounds);
  assert.equal(new Set(a.map((r) => r.songId)).size, CONFIG.dailyRounds);
  const others = ['2026-11-15', '2026-11-16', '2026-12-01'].map((d) => JSON.stringify(dailySet(d)));
  assert.ok(others.some((o) => o !== JSON.stringify(a)));
  const g1 = createGame({ mode: MODE.DAILY, dateKey: '2026-11-14' }, createRng(1)).state;
  const g2 = createGame({ mode: MODE.DAILY, dateKey: '2026-11-14' }, createRng(777)).state;
  assert.equal(g1.round.songId, g2.round.songId);
  assert.equal(g1.round.word, g2.round.word);
});

test('a musica para na palavra escondida e abre a pergunta', () => {
  const { rng, state } = startRun();
  assert.equal(state.phase, PHASE.LISTEN);
  const ask = runUntil(state, PHASE.ASK, rng);
  assert.equal(ask.t, 0);
  assert.equal(restartLine(ask), ask);
  assert.equal(restartLine({ ...state, t: 3 }).t, 0);
});

test('acertar rapido vale mais; sequencia multiplica', () => {
  assert.equal(speedPoints(0, 8), CONFIG.maxPoints);
  assert.equal(speedPoints(8, 8), CONFIG.minPoints);
  assert.ok(speedPoints(2, 8) > speedPoints(6, 8));
  assert.equal(streakMultiplier(1), 1);
  assert.ok(streakMultiplier(3) > streakMultiplier(2));
  assert.equal(streakMultiplier(50), streakMultiplier(CONFIG.streakMaxSteps + 1));

  const { rng, state } = startRun(5);
  const ask = runUntil(state, PHASE.ASK, rng);
  const fast = answer(ask, ask.round.correct);
  assert.equal(fast.state.score, CONFIG.maxPoints);
  assert.equal(fast.state.streak, 1);
  assert.ok(fast.events.some((e) => e.type === EVENT.ANSWER && e.right));
  const slow = answer(step(ask, ask.round.answerSeconds * 0.75, rng).state, ask.round.correct);
  assert.ok(slow.state.score < fast.state.score && slow.state.score >= CONFIG.minPoints);

  // Segunda certa seguida: multiplicador > 1.
  const next = runUntil(runUntil(fast.state, PHASE.LISTEN, rng), PHASE.ASK, rng);
  const second = answer(next, next.round.correct).state;
  assert.equal(second.score - fast.state.score, Math.round(CONFIG.maxPoints * streakMultiplier(2)));
});

test('errar ou deixar o tempo acabar tira uma vida e zera a sequencia', () => {
  const { rng, state } = startRun(7);
  const ask = runUntil(state, PHASE.ASK, rng);
  const wrongIndex = (ask.round.correct + 1) % 4;
  const wrong = answer({ ...ask, streak: 4 }, wrongIndex).state;
  assert.equal(wrong.lives, CONFIG.lives - 1);
  assert.equal(wrong.streak, 0);
  assert.equal(wrong.score, 0);
  const timeout = step(ask, ask.round.answerSeconds + 0.01, rng);
  assert.equal(timeout.state.lives, CONFIG.lives - 1);
  assert.ok(timeout.events.some((e) => e.type === EVENT.TIMEOUT));
  assert.equal(answer(state, 0).state, state);
  assert.equal(answer(ask, 7).state, ask);
});

test('tempo de resposta encurta com o nivel e respeita o minimo', () => {
  assert.ok(answerSecondsFor(2) < answerSecondsFor(1));
  assert.equal(answerSecondsFor(99), CONFIG.answerSecondsMin);
  assert.ok(poolSize(4) > poolSize(1));
});

const loseAll = (state, rng) => {
  let current = state;
  for (let i = 0; i < 50 && current.phase !== PHASE.OVER; i += 1) {
    current = runUntil(current, PHASE.ASK, rng);
    current = step(current, current.round.answerSeconds + 0.01, rng).state;
    current = runUntil(current, current.lives > 0 ? PHASE.LISTEN : PHASE.OVER, rng);
  }
  return current;
};

test('sem vidas a partida acaba; reviver vale uma vez', () => {
  const { rng, state } = startRun(11);
  const over = loseAll(state, rng);
  assert.equal(over.phase, PHASE.OVER);
  assert.equal(over.lives, 0);
  assert.ok(canRevive(over));
  const back = revive(over, rng).state;
  assert.equal(back.lives, 1);
  assert.equal(back.phase, PHASE.LISTEN);
  assert.equal(back.revived, true);
  const overAgain = loseAll(back, rng);
  assert.equal(canRevive(overAgain), false);
  assert.equal(revive(overAgain, rng).state, overAgain);
});

test('desafio do dia termina depois de 5 rodadas e nao revive', () => {
  const rng = createRng(2);
  let state = createGame({ mode: MODE.DAILY, dateKey: '2026-11-14' }, rng).state;
  for (let i = 0; i < CONFIG.dailyRounds; i += 1) {
    state = runUntil(state, PHASE.ASK, rng);
    state = answer(state, state.round.correct).state;
    state = runUntil(state, i < CONFIG.dailyRounds - 1 ? PHASE.LISTEN : PHASE.OVER, rng);
  }
  assert.equal(state.phase, PHASE.OVER);
  assert.equal(state.lives, CONFIG.lives);
  assert.equal(canRevive(state), false);
});

test('funcoes de estado nao alteram o que recebem', () => {
  const { rng, state } = startRun(13);
  let current = state;
  for (let i = 0; i < 400; i += 1) {
    const snapshot = JSON.stringify(current);
    const result = current.phase === PHASE.ASK && i % 3 === 0 ? answer(current, i % 4) : step(current, 0.1, rng);
    assert.equal(JSON.stringify(current), snapshot);
    current = result.state.phase === PHASE.OVER ? revive(result.state, rng).state : result.state;
    if (current.phase === PHASE.OVER) break;
  }
});

test('bot com semente joga 300 partidas sem erro', () => {
  const rng = createRng(2026);
  for (let run = 0; run < 300; run += 1) {
    let state = createGame({ mode: run % 10 === 0 ? MODE.DAILY : MODE.RUN, dateKey: `2026-01-${String((run % 28) + 1).padStart(2, '0')}` }, rng).state;
    let guard = 0;
    while (state.phase !== PHASE.OVER && guard < 20000) {
      guard += 1;
      if (state.phase === PHASE.ASK && rng() < 0.3) {
        const pick = rng() < 0.8 ? state.round.correct : Math.floor(rng() * 4);
        state = answer(state, pick).state;
      } else {
        state = step(state, 0.05 + rng() * 0.3, rng).state;
      }
      if (state.phase === PHASE.OVER && canRevive(state) && rng() < 0.3) state = revive(state, rng).state;
      assert.ok(state.lives >= 0 && state.score >= 0);
      if (state.round) assert.ok(isSongId(state.round.songId));
    }
    assert.equal(state.phase, PHASE.OVER, `partida ${run} nao terminou`);
  }
});

test('save faz ida e volta e tolera lixo e ids desconhecidos', () => {
  const save = { best: 420, bestLevel: 3, dailyDate: '2026-11-14', dailyScore: 310, songs: ['ciranda', 'trevo'] };
  assert.deepEqual(parseSave(serializeSave(save)), save);
  for (const raw of ['', null, undefined, 'lixo', '[]', 'null', '42', '{"best":-2}', '{"best":"x"}']) {
    assert.deepEqual(parseSave(raw), emptySave());
  }
  const odd = parseSave('{"best":7.8,"bestLevel":0,"dailyDate":"ontem","dailyScore":99,"songs":["ciranda","nao-existe",5,"ciranda"]}');
  assert.deepEqual(odd, { best: 7, bestLevel: 1, dailyDate: '', dailyScore: 0, songs: ['ciranda'] });

  const { rng, state } = startRun(4);
  const over = loseAll(state, rng);
  const before = JSON.stringify(save);
  const merged = applyRun(save, over);
  assert.equal(JSON.stringify(save), before);
  assert.equal(merged.best, Math.max(420, over.score));
});
