// Formato do save na nuvem. Sempre validar: o dado pode vir de uma versao antiga, corrompido ou com ids desconhecidos.
import { CONFIG } from './config.js';
import { carById } from './cars.js';
import { trackById } from './tracks.js';
import { createProfile } from './economy.js';

const MAX_LIST = 64;

const number = (value, max) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.floor(n)) : 0;
};

const idList = (value, exists, base) => {
  const list = Array.isArray(value) ? value.slice(0, MAX_LIST).filter((id) => typeof id === 'string' && exists(id)) : [];
  return Object.freeze([...new Set([...base, ...list])]);
};

const bestMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return Object.freeze({});
  const entries = Object.entries(value)
    .filter(([id]) => trackById(id))
    .map(([id, score]) => [id, number(score, CONFIG.maxScore)])
    .filter(([, score]) => score > 0);
  return Object.freeze(Object.fromEntries(entries));
};

export const serializeSave = (profile) => JSON.stringify({
  version: CONFIG.saveVersion,
  coins: profile.coins,
  cars: profile.cars,
  tracks: profile.tracks,
  best: profile.best,
  tried: profile.tried,
  car: profile.car,
  track: profile.track,
});

export const parseSave = (raw) => {
  const base = createProfile();
  if (typeof raw !== 'string' || raw === '') return base;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return base;
    const cars = idList(data.cars, (id) => carById(id), base.cars);
    const tracks = idList(data.tracks, (id) => trackById(id), base.tracks);
    return Object.freeze({
      coins: number(data.coins, CONFIG.maxCoins),
      cars,
      tracks,
      best: bestMap(data.best),
      tried: idList(data.tried, (id) => carById(id), []),
      car: cars.includes(data.car) ? data.car : base.car,
      track: tracks.includes(data.track) ? data.track : base.track,
    });
  } catch {
    return base;
  }
};
