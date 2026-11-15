// Transicoes de tela do jogo (puras): recebem o estado do app e devolvem um novo.
import { CONFIG, PHASE, PHYS } from './config.js';
import { CARS, carById } from './cars.js';
import { TRACKS, trackById } from './tracks.js';
import { createRun, stepRun } from './sim.js';
import { coinsFor, scoreRun } from './score.js';
import { bestTotal, recordCrash, selectCar } from './economy.js';

const DEMOS = Object.freeze([['hatch', 'wall', 95], ['pickup', 'post', 120], ['sport', 'wall', 140], ['van', 'post', 110]]);
const DEMO_HOLD = 1.2;

export const createDemo = (index) => {
  const [carId, trackId, kmh] = DEMOS[index % DEMOS.length];
  return { ...createRun({ car: carById(carId), track: trackById(trackId), speedKmh: kmh, seed: index + 7 }), demoIndex: index, hold: 0 };
};

// O demo do titulo roda sozinho e recomeca depois de cada batida.
export const stepDemo = (demo) => {
  if (demo.done) return demo.hold > DEMO_HOLD ? { state: createDemo(demo.demoIndex + 1), events: [], restarted: true } : { state: { ...demo, hold: demo.hold + PHYS.stepSeconds }, events: [] };
  return stepRun(demo);
};

export const createApp = (profile) => ({
  phase: PHASE.TITLE,
  profile,
  carIndex: Math.max(0, CARS.findIndex((c) => c.id === profile.car)),
  trialCar: null,
  run: null,
  demo: createDemo(0),
  meter: 0,
  aimKmh: CONFIG.minSpeedKmh,
  kmh: 0,
  score: null,
  coinsWon: 0,
  record: false,
  doubled: false,
  crashes: 0,
  adShownFor: 0,
  replayT: 0,
  seed: 1,
  bestTotal: bestTotal(profile),
});

export const currentCar = (app) => CARS[app.carIndex];

export const canDrive = (app, id) => app.profile.cars.includes(id) || app.trialCar === id;

export const toGarage = (app) => ({
  ...app, phase: PHASE.GARAGE, run: null,
  carIndex: app.trialCar ? app.carIndex : Math.max(0, CARS.findIndex((c) => c.id === app.profile.car)),
});

export const shiftCar = (app, delta) => ({ ...app, carIndex: (app.carIndex + delta + CARS.length) % CARS.length });

export const toTracks = (app) => {
  const car = currentCar(app);
  const profile = app.profile.cars.includes(car.id) ? selectCar(app.profile, car.id) : app.profile;
  return { ...app, phase: PHASE.TRACKS, profile };
};

// Mira: o carro aparece parado no comeco da pista enquanto o medidor oscila.
export const toAim = (app) => {
  const car = currentCar(app);
  const track = trackById(app.profile.track) ?? TRACKS[0];
  return { ...app, phase: PHASE.AIM, run: createRun({ car, track, speedKmh: CONFIG.minSpeedKmh }), meter: 0, aimKmh: CONFIG.minSpeedKmh };
};

export const kmhFromMeter = (value) => Math.round(CONFIG.minSpeedKmh + (CONFIG.maxSpeedKmh - CONFIG.minSpeedKmh) * value);

export const launch = (app) => {
  const seed = app.seed + 1;
  const run = createRun({ car: app.run.car, track: app.run.track, speedKmh: app.aimKmh, seed });
  return { ...app, phase: PHASE.RUN, run, seed, kmh: 0 };
};

// Fim do teste: pontua, paga as moedas e consome o teste gratis.
export const finishRun = (app) => {
  const score = scoreRun(app.run);
  const coinsWon = coinsFor(score.total);
  const { profile, record } = recordCrash(app.profile, app.run.track.id, score.total, coinsWon);
  return {
    ...app, phase: PHASE.RESULT, score, coinsWon, record, profile, doubled: false,
    crashes: app.crashes + 1, trialCar: null, bestTotal: bestTotal(profile),
  };
};

export const shouldShowInterstitial = (app) => app.crashes > 0
  && app.crashes % CONFIG.interstitialEveryCrashes === 0 && app.adShownFor !== app.crashes;
