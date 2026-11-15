import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, PHYS } from '../batida/src/config.js';
import { CARS, carById } from '../batida/src/cars.js';
import { TRACKS, trackById } from '../batida/src/tracks.js';
import { EVENT, SUB_DT, createRun, stepRun } from '../batida/src/sim.js';
import { kineticEnergy } from '../batida/src/physics.js';
import { totalStrain } from '../batida/src/carbody.js';
import { coinsFor, damagePercent, flipsOf, scoreRun } from '../batida/src/score.js';
import {
  addCoins, buyCar, buyTrack, canFreeTry, createProfile, recordCrash, selectCar, useFreeTry,
} from '../batida/src/economy.js';
import { parseSave, serializeSave } from '../batida/src/save.js';
import { stringsFor } from '../batida/src/strings.js';
import { frameAt, pushFrame } from '../batida/src/replay.js';

const SPEEDS = [CONFIG.minSpeedKmh, CONFIG.maxSpeedKmh];
const cache = new Map();

const allPoints = (world) => [
  ...world.bodies.flatMap((b) => b.nodes), ...world.dummies.flatMap((d) => d.nodes),
  ...world.props, ...world.debris.flatMap((d) => [d.a, d.b]),
];

// Roda ate o motor soltar o carro e depois mais `seconds` segundos.
const simulate = (carId, trackId, kmh, seconds = 6) => {
  const key = `${carId}/${trackId}/${kmh}/${seconds}`;
  if (cache.has(key)) return cache.get(key);
  let run = createRun({ car: carById(carId), track: trackById(trackId), speedKmh: kmh });
  const events = [];
  const collect = (result) => { events.push(...result.events); return result.state; };
  while (run.phase === 'drive' && run.t < 12) run = collect(stepRun(run));
  const launchEnergy = kineticEnergy(run.world, SUB_DT);
  const end = run.t + seconds;
  let maxOut = 0;
  while (run.t < end && !run.done) {
    run = collect(stepRun(run));
    allPoints(run.world).forEach((p) => {
      const b = PHYS.bounds;
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) maxOut = Infinity;
      else if (p.x < b.minX || p.x > b.maxX || p.y < b.minY || p.y > b.maxY) maxOut = Math.max(maxOut, 1);
    });
  }
  const result = { run, events, launchEnergy, endEnergy: kineticEnergy(run.world, SUB_DT), maxOut };
  cache.set(key, result);
  return result;
};

test('fisica estavel: todo carro em todo obstaculo, velocidade minima e maxima', () => {
  CARS.forEach((car) => TRACKS.forEach((track) => SPEEDS.forEach((kmh) => {
    const label = `${car.id} / ${track.id} / ${kmh}`;
    const { run, launchEnergy, endEnergy, maxOut } = simulate(car.id, track.id, kmh);
    assert.equal(maxOut, 0, `pontos fora do mundo ou NaN em ${label}`);
    assert.ok(run.phase === 'free', `o carro nunca foi solto em ${label}`);
    assert.ok(launchEnergy > 0, `sem energia no lancamento em ${label}`);
    assert.ok(endEnergy < launchEnergy * 0.25, `energia final alta em ${label}: ${(endEnergy / launchEnergy).toFixed(2)}`);
  })));
});

test('deformacao cresce com a velocidade (na media)', () => {
  const speeds = [30, 70, 110, 150];
  const average = (kmh) => CARS.reduce((sum, car) => sum + totalStrain(simulate(car.id, 'wall', kmh, 3).run.world.bodies[0]), 0) / CARS.length;
  const values = speeds.map(average);
  for (let i = 1; i < values.length; i += 1) assert.ok(values[i] > values[i - 1], `dano nao cresceu: ${values.map((v) => v.toFixed(2))}`);
  const slow = TRACKS.reduce((s, t) => s + totalStrain(simulate('hatch', t.id, 30).run.world.bodies[0]), 0);
  const fast = TRACKS.reduce((s, t) => s + totalStrain(simulate('hatch', t.id, 150).run.world.bodies[0]), 0);
  assert.ok(fast > slow * 2);
});

test('pecas so se soltam acima do limite', () => {
  CARS.forEach((car) => {
    const slow = simulate(car.id, 'wall', 30, 3);
    assert.equal(slow.run.stats.parts, 0, `${car.id} perdeu peca a 30 km/h`);
    assert.ok(slow.run.world.bodies[0].parts.every((p) => p.on));
  });
  const fast = simulate('hatch', 'wall', 150, 3);
  assert.ok(fast.run.stats.parts >= 1);
  assert.ok(fast.events.some((e) => e.type === EVENT.DETACH));
  assert.equal(fast.run.world.bodies[0].parts.filter((p) => !p.on).length, fast.run.stats.parts);
});

test('bonecos so sao ejetados em batidas fortes', () => {
  CARS.forEach((car) => {
    const slow = simulate(car.id, 'wall', 30, 3);
    assert.equal(slow.run.stats.ejected, 0, `${car.id} ejetou a 30 km/h`);
    assert.ok(slow.run.world.dummies.every((d) => d.attached));
  });
  const fast = simulate('hatch', 'wall', 150, 3);
  assert.equal(fast.run.stats.ejected, carById('hatch').seats.length);
  assert.ok(fast.events.some((e) => e.type === EVENT.EJECT));
  assert.ok(fast.run.world.dummies.every((d) => !d.attached && d.farthest > 0));
});

test('pontuacao: componentes e total', () => {
  const { run } = simulate('hatch', 'wall', 150, 6);
  const score = scoreRun(run);
  const S = CONFIG.score;
  assert.equal(score.lines.parts, run.stats.parts * S.part);
  assert.equal(score.lines.eject, run.stats.ejected * S.eject);
  assert.equal(score.lines.glass, run.stats.glass ? S.glass : 0);
  assert.equal(score.lines.damage, score.damagePct * S.damage);
  assert.equal(score.total, Object.values(score.lines).reduce((a, b) => a + b, 0));
  assert.ok(score.damagePct > 0 && score.damagePct <= 100);
  assert.ok(scoreRun(simulate('hatch', 'wall', 30, 6).run).total < score.total);
  assert.equal(damagePercent(0, 2), 0);
  assert.equal(damagePercent(1000, 2), 100);
  assert.equal(flipsOf(0), 0);
  assert.equal(flipsOf(2 * Math.PI), 1);
  assert.equal(flipsOf(-4 * Math.PI), 2);
  assert.equal(coinsFor(0), 0);
  assert.equal(coinsFor(CONFIG.coinDivisor * 7 + 3), 7);
});

test('economia: nao gasta alem do saldo, nao compra duas vezes, teste gratis uma vez', () => {
  const start = createProfile();
  assert.equal(start.coins, 0);
  assert.deepEqual([...start.cars], ['hatch']);
  assert.deepEqual([...start.tracks], ['wall']);
  const broke = buyCar(start, 'pickup');
  assert.equal(broke.ok, false);
  assert.equal(broke.profile, start);
  const rich = addCoins(start, 1000);
  const bought = buyCar(rich, 'pickup');
  assert.ok(bought.ok);
  assert.equal(bought.profile.coins, 1000 - carById('pickup').price);
  assert.equal(bought.profile.car, 'pickup');
  assert.equal(buyCar(bought.profile, 'pickup').ok, false);
  assert.equal(buyCar(rich, 'nope').ok, false);
  const track = buyTrack(bought.profile, 'post');
  assert.ok(track.ok);
  assert.equal(buyTrack(track.profile, 'post').ok, false);
  assert.equal(rich.coins, 1000, 'compra alterou o perfil original');
  assert.ok(canFreeTry(start, 'bus'));
  const tried = useFreeTry(start, 'bus');
  assert.ok(tried.ok);
  assert.equal(canFreeTry(tried.profile, 'bus'), false);
  assert.equal(useFreeTry(tried.profile, 'bus').ok, false);
  assert.equal(canFreeTry(start, 'hatch'), false, 'carro ja comprado nao tem teste gratis');
  assert.equal(selectCar(start, 'bus').car, start.car, 'nao seleciona carro bloqueado');
  const first = recordCrash(start, 'wall', 5000, 250);
  assert.ok(first.record);
  assert.equal(first.profile.coins, 250);
  const second = recordCrash(first.profile, 'wall', 3000, 150);
  assert.equal(second.record, false);
  assert.equal(second.profile.best.wall, 5000);
  assert.equal(second.profile.coins, 400);
  assert.equal(addCoins(start, Number.NaN).coins, 0);
  assert.equal(addCoins(start, -50).coins, 0);
});

test('buffer de replay guarda so os ultimos 2 segundos', () => {
  const { run } = simulate('hatch', 'wall', 150, 6);
  const cap = Math.round(CONFIG.replaySeconds / PHYS.stepSeconds);
  assert.equal(run.replay.cap, cap);
  assert.equal(run.replay.frames.length, cap);
  let buffer = { frames: [], cap: 3 };
  for (let i = 0; i < 10; i += 1) buffer = pushFrame(buffer, i);
  assert.deepEqual(buffer.frames, [7, 8, 9]);
  assert.equal(frameAt(buffer, 0, 60), 7);
  assert.equal(frameAt(buffer, 99, 60), 9);
  assert.equal(frameAt({ frames: [], cap: 3 }, 0, 60), null);
});

test('stepRun nao altera o estado recebido', () => {
  let run = createRun({ car: carById('hatch'), track: trackById('ramp'), speedKmh: 150 });
  for (let i = 0; i < 260; i += 1) {
    const snapshot = JSON.stringify(run);
    const next = stepRun(run).state;
    assert.equal(JSON.stringify(run), snapshot, `passo ${i} alterou a entrada`);
    assert.notEqual(next, run);
    run = next;
  }
});

test('save: ida e volta e tolerancia a lixo', () => {
  const profile = recordCrash(useFreeTry(buyTrack(buyCar(addCoins(createProfile(), 5000), 'pickup').profile, 'post').profile, 'van').profile, 'post', 1234, 61).profile;
  const back = parseSave(serializeSave(profile));
  assert.deepEqual({ ...back }, { ...profile });
  const base = createProfile();
  ['', null, undefined, '{', 'null', '42', '[]', '"x"', '{"coins":"abc"}'].forEach((raw) => {
    assert.deepEqual({ ...parseSave(raw) }, { ...base }, `lixo: ${raw}`);
  });
  const weird = parseSave(JSON.stringify({
    coins: -5, cars: ['ufo', 'van', 7, 'van'], tracks: ['moon', 'cliff'], best: { moon: 9, cliff: 'x', wall: 99.7 },
    tried: ['ufo', 'bus'], car: 'ufo', track: 'cliff',
  }));
  assert.equal(weird.coins, 0);
  assert.deepEqual([...weird.cars], ['hatch', 'van']);
  assert.deepEqual([...weird.tracks], ['wall', 'cliff']);
  assert.deepEqual({ ...weird.best }, { wall: 99 });
  assert.deepEqual([...weird.tried], ['bus']);
  assert.equal(weird.car, 'hatch');
  assert.equal(weird.track, 'cliff');
  assert.equal(parseSave(JSON.stringify({ coins: 1e30 })).coins, CONFIG.maxCoins);
});

test('textos: portugues, ingles e ingles como reserva', () => {
  assert.equal(stringsFor('pt-BR').title, 'BATIDA');
  assert.equal(stringsFor('en-US').subtitle, 'CRASH');
  assert.equal(stringsFor('xx').title, stringsFor('en').title);
  assert.equal(stringsFor(undefined).title, stringsFor('en').title);
  const pt = stringsFor('pt');
  const en = stringsFor('en');
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
  CARS.forEach((car) => { assert.ok(pt.cars[car.id] && en.cars[car.id]); });
  TRACKS.forEach((track) => { assert.ok(pt.trackNames[track.id] && en.trackNames[track.id]); });
});

test('dados de carros e pistas sao validos', () => {
  const ids = new Set(CARS.map((c) => c.id));
  assert.equal(ids.size, CARS.length);
  assert.equal(CARS.filter((c) => c.price === 0).length, 1);
  CARS.forEach((car) => {
    assert.equal(car.belt.length, 8);
    assert.equal(car.roof.length, 8);
    assert.ok(car.mass > 0 && car.stiff > 0 && car.stiff <= 1);
  });
  assert.equal(TRACKS.filter((t) => t.price === 0).length, 1);
});
