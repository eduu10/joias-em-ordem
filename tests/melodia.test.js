import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY, CATEGORY_ORDER, CONFIG, OUTCOME, PHASE, SHOP_ITEMS } from '../melodia/src/config.js';
import { createRng, shuffled } from '../melodia/src/rng.js';
import { TUNES, midiOf, parseScore, tuneById, tuneSeconds, tunesIn } from '../melodia/src/tunes.js';
import {
  EVENT, answer, buildQuestion, createMatch, currentQuestion, pickTunes, pointsFor, rivalSkill, step,
} from '../melodia/src/quiz.js';
import {
  applyMatch, buyItem, canBuy, claimHomeAd, createProfile, instrumentOverride, levelInfo, outcomeOf, rewardFor,
  toggleEquip,
} from '../melodia/src/profile.js';
import { parseSave, serializeSave } from '../melodia/src/save.js';
import { stringsFor } from '../melodia/src/strings.js';

const DT = 1 / 20;
const REAL_CATEGORIES = CATEGORY_ORDER.filter((category) => category !== CATEGORY.MIX);
const PRESETS = ['piano', 'musicbox', 'flute', 'strings'];

// Jogador automatico com semente: responde depois de um tempo sorteado e acerta `skill` das vezes.
const playMatch = (seed, setup = {}, skill = 0.7) => {
  const rng = createRng(seed);
  const bot = createRng(seed + 7919);
  let match = createMatch({ category: CATEGORY.MIX, level: 1, recent: [], ...setup }, rng);
  const events = [];
  let answerAt = 0;
  for (let i = 0; i < 20000 && match.phase !== PHASE.DONE; i += 1) {
    let result = step(match, DT);
    if (result.events.some((event) => event.type === EVENT.ROUND_START)) answerAt = 0.5 + bot() * 11;
    match = result.state;
    events.push(...result.events);
    if (match.phase === PHASE.PLAY && CONFIG.roundSeconds - match.timeLeft >= answerAt) {
      const question = currentQuestion(match);
      const wrong = question.options.filter((id) => id !== question.tuneId);
      const pick = bot() < skill ? question.tuneId : wrong[Math.floor(bot() * wrong.length)];
      result = answer(match, pick);
      match = result.state;
      events.push(...result.events);
    }
  }
  return { match, events };
};

const toPlay = (match) => {
  let current = match;
  while (current.phase !== PHASE.PLAY) current = step(current, DT).state;
  return current;
};

test('toda melodia e bem formada', () => {
  assert.ok(TUNES.length >= 30, `so ${TUNES.length} melodias`);
  assert.equal(new Set(TUNES.map((tune) => tune.id)).size, TUNES.length);
  assert.equal(new Set(TUNES.map((tune) => tune.pt)).size, TUNES.length);
  assert.equal(new Set(TUNES.map((tune) => tune.en)).size, TUNES.length);
  TUNES.forEach((tune) => {
    assert.match(tune.id, /^[a-z0-9-]+$/);
    assert.ok(tune.pt.length > 2 && tune.en.length > 2, tune.id);
    assert.ok(REAL_CATEGORIES.includes(tune.category), `${tune.id}: categoria ${tune.category}`);
    assert.ok(tune.composer === null || tune.composer.length > 3, tune.id);
    assert.ok(PRESETS.includes(tune.preset), `${tune.id}: timbre ${tune.preset}`);
    assert.ok(tune.tempo >= 50 && tune.tempo <= 220, `${tune.id}: andamento ${tune.tempo}`);
    const pitched = tune.notes.filter((note) => note.midi !== null);
    assert.ok(pitched.length >= 12, `${tune.id}: so ${pitched.length} notas`);
    assert.notEqual(tune.notes[0].midi, null, `${tune.id} comeca com pausa`);
    assert.notEqual(tune.notes.at(-1).midi, null, `${tune.id} termina com pausa`);
    tune.notes.forEach((note) => {
      assert.ok(Number.isFinite(note.beats) && note.beats > 0, `${tune.id}: duracao ${note.beats}`);
      if (note.midi !== null) assert.ok(note.midi >= 45 && note.midi <= 88, `${tune.id}: nota ${note.midi}`);
    });
    const seconds = tuneSeconds(tune);
    assert.ok(seconds >= 6 && seconds <= 16, `${tune.id}: ${seconds.toFixed(1)} s`);
  });
});

test('notas viram numeros MIDI certos', () => {
  assert.equal(midiOf('C4'), 60);
  assert.equal(midiOf('A4'), 69);
  assert.equal(midiOf('F#5'), 78);
  assert.equal(midiOf('Bb3'), 58);
  assert.equal(midiOf('R'), null);
  assert.throws(() => midiOf('H2'));
  assert.deepEqual(parseScore('C4 D4:.5 R:2', 1), [
    { midi: 60, beats: 1 }, { midi: 62, beats: 0.5 }, { midi: null, beats: 2 },
  ]);
  // Ode a Alegria comeca Mi Mi Fa Sol Sol Fa Mi Re.
  assert.deepEqual(tuneById('ode-joy').notes.slice(0, 8).map((note) => note.midi), [64, 64, 65, 67, 67, 65, 64, 62]);
});

test('toda categoria tem pelo menos 6 melodias', () => {
  REAL_CATEGORIES.forEach((category) => {
    assert.ok(tunesIn(category).length >= 6, `${category}: ${tunesIn(category).length}`);
  });
  assert.equal(tunesIn(CATEGORY.MIX).length, TUNES.length);
});

test('pergunta tem 4 opcoes diferentes, com a certa, de preferencia da mesma categoria', () => {
  const rng = createRng(11);
  for (let i = 0; i < 400; i += 1) {
    const tune = TUNES[i % TUNES.length];
    const question = buildQuestion(tune, rng);
    assert.equal(question.options.length, CONFIG.options);
    assert.equal(new Set(question.options).size, CONFIG.options);
    assert.ok(question.options.includes(tune.id));
    question.options.forEach((id) => assert.equal(tuneById(id).category, tune.category));
    assert.equal(new Set(question.options.map((id) => tuneById(id).pt)).size, CONFIG.options);
  }
  const positions = new Set();
  for (let i = 0; i < 60; i += 1) positions.add(buildQuestion(TUNES[0], rng).options.indexOf(TUNES[0].id));
  assert.equal(positions.size, CONFIG.options, 'a resposta certa precisa mudar de lugar');
});

test('partida nunca repete melodia', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    CATEGORY_ORDER.forEach((category) => {
      const match = createMatch({ category, level: 3, recent: [] }, createRng(seed));
      const ids = match.questions.map((question) => question.tuneId);
      assert.equal(ids.length, CONFIG.rounds);
      assert.equal(new Set(ids).size, CONFIG.rounds);
      if (category !== CATEGORY.MIX) ids.forEach((id) => assert.equal(tuneById(id).category, category));
    });
  }
});

test('evita melodias ouvidas ha pouco', () => {
  const pool = tunesIn(CATEGORY.CLASSICAL).map((tune) => tune.id);
  const recent = pool.slice(0, pool.length - CONFIG.rounds);
  for (let seed = 1; seed <= 50; seed += 1) {
    const picked = pickTunes(CATEGORY.CLASSICAL, recent, createRng(seed)).map((tune) => tune.id);
    picked.forEach((id) => assert.ok(!recent.includes(id), `${id} repetida cedo demais`));
  }
  // Sem melodias novas suficientes, completa com as ouvidas ha mais tempo.
  const almostAll = pool.slice(0, pool.length - 2);
  const picked = pickTunes(CATEGORY.CLASSICAL, almostAll, createRng(5)).map((tune) => tune.id);
  assert.equal(new Set(picked).size, CONFIG.rounds);
  pool.slice(-2).forEach((id) => assert.ok(picked.includes(id)));
  assert.deepEqual(picked.slice(2), almostAll.slice(0, CONFIG.rounds - 2));
  assert.deepEqual(pickTunes(CATEGORY.FOLK, [], createRng(9)), pickTunes(CATEGORY.FOLK, [], createRng(9)));
});

test('lista de recentes cresce com as partidas e tem limite', () => {
  let profile = createProfile();
  for (let seed = 1; seed <= 8; seed += 1) {
    const before = profile.recent;
    const { match } = playMatch(seed, { recent: before });
    const heard = match.history.map((entry) => entry.tuneId);
    if (before.length <= TUNES.length - CONFIG.rounds) heard.forEach((id) => assert.ok(!before.includes(id)));
    profile = applyMatch(profile, match).profile;
    assert.deepEqual(profile.recent.slice(-CONFIG.rounds), heard);
    assert.ok(profile.recent.length <= CONFIG.recentLimit);
    assert.equal(new Set(profile.recent).size, profile.recent.length);
  }
});

test('pontos pela rapidez: mais rapido vale mais, erro e tempo esgotado valem zero', () => {
  assert.equal(pointsFor(true, CONFIG.roundSeconds), CONFIG.maxPoints);
  assert.ok(pointsFor(true, 8) > pointsFor(true, 4));
  assert.ok(pointsFor(true, 4) > pointsFor(true, 1.5));
  assert.equal(pointsFor(true, 0.01), CONFIG.minCorrectPoints);
  assert.equal(pointsFor(false, CONFIG.roundSeconds), 0);
  assert.equal(pointsFor(true, 0), 0);
  assert.ok(pointsFor(true, 999) <= CONFIG.maxPoints);

  const base = toPlay(createMatch({ category: CATEGORY.FOLK }, createRng(3)));
  const question = currentQuestion(base);
  const fast = answer(step(base, 1).state, question.tuneId);
  const slow = answer(step(base, 3).state, question.tuneId);
  assert.ok(fast.state.playerScore > slow.state.playerScore && slow.state.playerScore > 0);
  assert.equal(fast.events[0].type, EVENT.ANSWER);
  assert.equal(fast.state.phase, PHASE.FEEDBACK);

  const wrongId = question.options.find((id) => id !== question.tuneId);
  const wrong = answer(base, wrongId);
  assert.equal(wrong.state.playerScore, 0);
  assert.equal(wrong.events[0].correct, false);

  const timedOut = step(base, CONFIG.roundSeconds + 1);
  assert.equal(timedOut.state.phase, PHASE.FEEDBACK);
  assert.equal(timedOut.state.playerScore, 0);
  assert.equal(timedOut.state.pick, null);
  assert.ok(timedOut.events.some((event) => event.type === EVENT.TIMEOUT));

  // So vale responder durante a rodada, com um titulo que esta na tela, e uma vez so.
  assert.equal(answer(fast.state, question.tuneId).state, fast.state);
  assert.equal(answer(base, 'nao-existe').state, base);
  const ready = createMatch({ category: CATEGORY.FOLK }, createRng(3));
  assert.equal(answer(ready, question.tuneId).state, ready);
});

test('rival e deterministico para a mesma semente e melhora com o nivel', () => {
  const a = createMatch({ category: CATEGORY.MIX, level: 4 }, createRng(42));
  const b = createMatch({ category: CATEGORY.MIX, level: 4 }, createRng(42));
  const c = createMatch({ category: CATEGORY.MIX, level: 4 }, createRng(43));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.questions, c.questions);
  assert.deepEqual(playMatch(77).match, playMatch(77).match);

  const novice = rivalSkill(1);
  const expert = rivalSkill(30);
  assert.ok(expert.accuracy > novice.accuracy && expert.accuracy <= CONFIG.rivalAccuracyMax);
  assert.ok(expert.delayMax < novice.delayMax && expert.delayMin < novice.delayMin);
  assert.deepEqual(rivalSkill(9999), rivalSkill(500));
  [1, 10, 99].forEach((level) => {
    const skill = rivalSkill(level);
    const match = createMatch({ category: CATEGORY.MIX, level }, createRng(level));
    match.questions.forEach((question) => {
      assert.equal(typeof question.rivalCorrect, 'boolean');
      assert.ok(question.rivalDelay >= skill.delayMin && question.rivalDelay <= skill.delayMax);
      assert.ok(question.rivalDelay < CONFIG.roundSeconds);
    });
  });

  // O rival pontua pelo proprio tempo de resposta, igual ao jogador.
  const { match, events } = playMatch(5);
  const expected = match.questions.reduce((sum, question) =>
    sum + pointsFor(question.rivalCorrect, CONFIG.roundSeconds - question.rivalDelay), 0);
  assert.equal(match.rivalScore, expected);
  assert.ok(events.filter((event) => event.type === EVENT.RIVAL_ANSWER).length <= CONFIG.rounds);
});

test('rival aparece como computador nos textos', () => {
  assert.match(stringsFor('pt').rival, /computador/i);
  assert.match(stringsFor('pt').rivalShort, /CPU/);
  assert.match(stringsFor('en').rival, /computer/i);
  assert.match(stringsFor('en').rivalShort, /CPU/);
  assert.match(stringsFor('pt').rivalNote, /simulado/);
  assert.match(stringsFor('en').rivalNote, /simulated/);
});

test('resultado da partida e recompensas em moedas e XP', () => {
  assert.equal(outcomeOf(300, 200), OUTCOME.WIN);
  assert.equal(outcomeOf(200, 200), OUTCOME.TIE);
  assert.equal(outcomeOf(0, 10), OUTCOME.LOSE);
  assert.equal(rewardFor(OUTCOME.WIN, 0, 1, false).coins, 30);
  assert.equal(rewardFor(OUTCOME.TIE, 0, 0, false).coins, 15);
  assert.equal(rewardFor(OUTCOME.LOSE, 0, 0, false).coins, 5);
  assert.equal(rewardFor(OUTCOME.WIN, 0, 3, false).coins, 30 + 2 * CONFIG.streakBonusPerWin);
  assert.equal(rewardFor(OUTCOME.WIN, 0, 500, false).streakBonus, CONFIG.streakBonusCap);
  assert.equal(rewardFor(OUTCOME.LOSE, 0, 4, false).streakBonus, 0);
  assert.equal(rewardFor(OUTCOME.LOSE, 0, 0, true).coins, 10);
  assert.equal(rewardFor(OUTCOME.WIN, 0, 2, true).coins, 70);
  assert.ok(rewardFor(OUTCOME.WIN, 400, 1, false).xp > rewardFor(OUTCOME.WIN, 100, 1, false).xp);
  assert.ok(rewardFor(OUTCOME.WIN, 100, 1, false).xp > rewardFor(OUTCOME.LOSE, 100, 0, false).xp);

  const finished = { playerScore: 320, rivalScore: 150, double: false, history: [{ tuneId: 'ode-joy' }] };
  const first = applyMatch(createProfile(), finished);
  assert.equal(first.summary.outcome, OUTCOME.WIN);
  assert.equal(first.profile.coins, 30);
  assert.deepEqual([first.profile.wins, first.profile.matches, first.profile.best, first.profile.streak], [1, 1, 320, 1]);
  assert.ok(first.summary.newBest && first.profile.adReady);
  const second = applyMatch(first.profile, finished);
  assert.equal(second.profile.coins, 30 + 35);
  assert.equal(second.summary.newBest, false);
  const lost = applyMatch(second.profile, { ...finished, playerScore: 10, double: true });
  assert.equal(lost.summary.outcome, OUTCOME.LOSE);
  assert.equal(lost.profile.coins, 65 + 10);
  assert.deepEqual([lost.profile.wins, lost.profile.matches, lost.profile.best, lost.profile.streak], [2, 3, 320, 0]);

  assert.deepEqual(levelInfo(0), { level: 1, into: 0, need: CONFIG.xpLevelBase });
  assert.equal(levelInfo(CONFIG.xpLevelBase).level, 2);
  assert.ok(levelInfo(100000).level > levelInfo(1000).level);
  assert.equal(levelInfo(1e12).level, CONFIG.maxLevel);
  assert.equal(levelInfo('lixo').level, 1);
});

test('bonus do anuncio da tela inicial: no maximo um por partida jogada', () => {
  const fresh = createProfile();
  assert.equal(claimHomeAd(fresh), fresh);
  const played = applyMatch(fresh, playMatch(2).match).profile;
  const claimed = claimHomeAd(played);
  assert.equal(claimed.coins, played.coins + CONFIG.homeAdCoins);
  assert.equal(claimHomeAd(claimed), claimed);
  assert.ok(claimHomeAd(applyMatch(claimed, playMatch(3).match).profile).coins > claimed.coins + CONFIG.homeAdCoins - 1);
});

test('lojinha: nao gasta mais do que tem e nao compra duas vezes', () => {
  assert.ok(SHOP_ITEMS.length >= 3 && SHOP_ITEMS.length <= 5);
  assert.equal(new Set(SHOP_ITEMS.map((item) => item.id)).size, SHOP_ITEMS.length);
  const [cheap] = SHOP_ITEMS;
  const poor = { ...createProfile(), coins: cheap.price - 1 };
  assert.equal(canBuy(poor, cheap.id), false);
  assert.equal(buyItem(poor, cheap.id).profile, poor);
  assert.equal(buyItem(poor, 'nao-existe').bought, false);

  const rich = { ...createProfile(), coins: 1000 };
  const once = buyItem(rich, cheap.id);
  assert.ok(once.bought);
  assert.equal(once.profile.coins, 1000 - cheap.price);
  assert.deepEqual(once.profile.owned, [cheap.id]);
  assert.equal(once.profile.equipped[cheap.kind], cheap.id);
  const twice = buyItem(once.profile, cheap.id);
  assert.equal(twice.bought, false);
  assert.equal(twice.profile, once.profile);

  let profile = rich;
  SHOP_ITEMS.forEach((item) => { profile = buyItem(profile, item.id).profile; });
  assert.equal(profile.owned.length, SHOP_ITEMS.length);
  assert.equal(profile.coins, 1000 - SHOP_ITEMS.reduce((sum, item) => sum + item.price, 0));
  assert.ok(profile.coins >= 0);

  assert.equal(instrumentOverride(rich), null);
  const withSound = buyItem(rich, 'inst-musicbox').profile;
  assert.equal(instrumentOverride(withSound), 'musicbox');
  const off = toggleEquip(withSound, 'inst-musicbox');
  assert.equal(instrumentOverride(off), null);
  assert.equal(instrumentOverride(toggleEquip(off, 'inst-musicbox')), 'musicbox');
  assert.equal(toggleEquip(rich, 'inst-musicbox'), rich);
});

test('funcoes de estado nao mutam o que recebem', () => {
  const recent = Object.freeze(['ode-joy', 'twinkle']);
  let match = createMatch({ category: CATEGORY.MIX, level: 2, recent }, createRng(8));
  const bot = createRng(99);
  const seen = new Set();
  for (let i = 0; i < 4000 && match.phase !== PHASE.DONE; i += 1) {
    const snapshot = JSON.stringify(match);
    let result = step(match, DT);
    assert.equal(JSON.stringify(match), snapshot);
    if (result.state.phase === PHASE.PLAY && bot() < 0.02) {
      const before = JSON.stringify(result.state);
      const answered = answer(result.state, currentQuestion(result.state).options[0]);
      assert.equal(JSON.stringify(result.state), before);
      result = { state: answered.state, events: [...result.events, ...answered.events] };
    }
    result.events.forEach((event) => seen.add(event.type));
    match = result.state;
  }
  assert.equal(match.phase, PHASE.DONE);
  assert.equal(step(match, DT).state, match);
  [EVENT.ROUND_START, EVENT.MATCH_END].forEach((type) => assert.ok(seen.has(type), type));

  const profile = Object.freeze({
    ...createProfile(), coins: 500, recent, owned: Object.freeze([]), equipped: Object.freeze({ instrument: null, frame: null }),
  });
  const snapshot = JSON.stringify(profile);
  applyMatch(profile, match);
  buyItem(profile, SHOP_ITEMS[0].id);
  toggleEquip(buyItem(profile, SHOP_ITEMS[0].id).profile, SHOP_ITEMS[0].id);
  claimHomeAd({ ...profile, adReady: true });
  assert.equal(JSON.stringify(profile), snapshot);
  const list = Object.freeze([1, 2, 3, 4]);
  assert.equal(shuffled(list, createRng(1)).length, 4);
  assert.deepEqual(list, [1, 2, 3, 4]);
});

test('jogador automatico com semente joga 300 partidas inteiras', () => {
  let profile = createProfile();
  const outcomes = { win: 0, tie: 0, lose: 0 };
  for (let seed = 1; seed <= 300; seed += 1) {
    const category = CATEGORY_ORDER[seed % CATEGORY_ORDER.length];
    const level = levelInfo(profile.xp).level;
    const { match, events } = playMatch(seed, { category, level, recent: profile.recent, double: seed % 9 === 0 });
    assert.equal(match.phase, PHASE.DONE);
    assert.equal(match.history.length, CONFIG.rounds);
    assert.equal(events.filter((event) => event.type === EVENT.ROUND_START).length, CONFIG.rounds);
    assert.equal(events.filter((event) => event.type === EVENT.MATCH_END).length, 1);
    assert.equal(match.playerScore, match.history.reduce((sum, entry) => sum + entry.points, 0));
    assert.ok(match.playerScore >= 0 && match.playerScore <= CONFIG.rounds * CONFIG.maxPoints);
    assert.ok(match.rivalScore >= 0 && match.rivalScore <= CONFIG.rounds * CONFIG.maxPoints);
    const result = applyMatch(profile, match);
    outcomes[result.summary.outcome] += 1;
    profile = parseSave(serializeSave(result.profile));
    assert.deepEqual(profile, result.profile);
  }
  assert.equal(profile.matches, 300);
  assert.equal(profile.wins, outcomes.win);
  assert.ok(outcomes.win > 30 && outcomes.lose > 30, JSON.stringify(outcomes));
  console.log(`  bot: ${JSON.stringify(outcomes)}, nivel ${levelInfo(profile.xp).level}, ${profile.coins} moedas`);
});

test('save faz ida e volta e tolera dado invalido', () => {
  const profile = {
    coins: 345, xp: 1280, wins: 7, matches: 12, best: 410, streak: 2, recent: ['ode-joy', 'ciranda'],
    owned: ['frame-gold', 'inst-strings'], equipped: { instrument: 'inst-strings', frame: null }, adReady: true,
  };
  assert.deepEqual(parseSave(serializeSave(profile)), profile);
  assert.deepEqual(parseSave(serializeSave(createProfile())), createProfile());
  for (const raw of ['', null, undefined, 42, 'lixo', '[]', 'null', '"x"', '{', '{"coins":-2}', '{"coins":"x","recent":7}']) {
    assert.deepEqual(parseSave(raw), createProfile());
  }
  const messy = parseSave(JSON.stringify({
    coins: 99.9, xp: '120', wins: 50, matches: 3, best: 99999, streak: -4,
    recent: ['ode-joy', 'musica-que-nao-existe', 5, null, 'ode-joy', 'twinkle'],
    owned: ['frame-gold', 'item-fantasma', 'frame-gold', {}],
    equipped: { instrument: 'frame-gold', frame: 'frame-neon' },
    adReady: 'sim', extra: { a: 1 },
  }));
  assert.deepEqual(messy, {
    coins: 99, xp: 120, wins: 3, matches: 3, best: CONFIG.rounds * CONFIG.maxPoints, streak: 0,
    recent: ['ode-joy', 'twinkle'], owned: ['frame-gold'], equipped: { instrument: null, frame: null }, adReady: false,
  });
  const long = parseSave(JSON.stringify({ recent: TUNES.map((tune) => tune.id) }));
  assert.equal(long.recent.length, CONFIG.recentLimit);
  assert.equal(parseSave('{"equipped":"x","owned":"y","recent":{}}').owned.length, 0);
});

test('textos: portugues, ingles e idioma desconhecido cai no ingles', () => {
  const pt = stringsFor('pt-BR');
  const en = stringsFor('en-US');
  assert.equal(pt.lang, 'pt');
  assert.equal(stringsFor('PT').lang, 'pt');
  [undefined, null, '', 'fr-FR', 'xx', 42].forEach((tag) => assert.equal(stringsFor(tag), en));
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
  Object.entries({ ...pt, ...en }).forEach(([key, value]) => assert.ok(typeof value === 'string' && value.length > 0, key));
  CATEGORY_ORDER.forEach((category) => assert.ok(pt[`cat_${category}`] && en[`cat_${category}`], category));
  SHOP_ITEMS.forEach((item) => {
    assert.ok(pt[`item_${item.id}`] && en[`item_${item.id}`], item.id);
    assert.ok(pt[`kind_${item.kind}`] && en[`kind_${item.kind}`], item.kind);
  });
});
