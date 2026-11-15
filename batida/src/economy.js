// Perfil do jogador: moedas, carros e pistas liberados, recordes e testes gratis ja usados. Funcoes puras.
import { CONFIG } from './config.js';
import { CARS, carById } from './cars.js';
import { TRACKS, trackById } from './tracks.js';

export const createProfile = () => Object.freeze({
  coins: 0,
  cars: Object.freeze(CARS.filter((c) => c.price === 0).map((c) => c.id)),
  tracks: Object.freeze(TRACKS.filter((t) => t.price === 0).map((t) => t.id)),
  best: Object.freeze({}),
  tried: Object.freeze([]),
  car: CARS[0].id,
  track: TRACKS[0].id,
});

const freeze = (profile) => Object.freeze({ ...profile });

const buy = (profile, key, item) => {
  if (!item || profile[key].includes(item.id) || profile.coins < item.price) return { profile, ok: false };
  return { profile: freeze({ ...profile, coins: profile.coins - item.price, [key]: Object.freeze([...profile[key], item.id]) }), ok: true };
};

export const ownsCar = (profile, id) => profile.cars.includes(id);
export const ownsTrack = (profile, id) => profile.tracks.includes(id);
export const canBuyCar = (profile, id) => buy(profile, 'cars', carById(id)).ok;
export const canBuyTrack = (profile, id) => buy(profile, 'tracks', trackById(id)).ok;
export const buyCar = (profile, id) => {
  const result = buy(profile, 'cars', carById(id));
  return result.ok ? { ...result, profile: freeze({ ...result.profile, car: id }) } : result;
};
export const buyTrack = (profile, id) => {
  const result = buy(profile, 'tracks', trackById(id));
  return result.ok ? { ...result, profile: freeze({ ...result.profile, track: id }) } : result;
};

// Um teste gratis (depois de um anuncio) por carro bloqueado.
export const canFreeTry = (profile, id) => Boolean(carById(id)) && !ownsCar(profile, id) && !profile.tried.includes(id);
export const useFreeTry = (profile, id) => (canFreeTry(profile, id)
  ? { profile: freeze({ ...profile, tried: Object.freeze([...profile.tried, id]) }), ok: true }
  : { profile, ok: false });

export const selectCar = (profile, id) => (ownsCar(profile, id) ? freeze({ ...profile, car: id }) : profile);
export const selectTrack = (profile, id) => (ownsTrack(profile, id) ? freeze({ ...profile, track: id }) : profile);

export const addCoins = (profile, amount) => {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return freeze({ ...profile, coins: Math.min(CONFIG.maxCoins, profile.coins + safe) });
};

// Fim de um teste: soma as moedas e guarda o recorde da pista. Devolve tambem se foi recorde novo.
export const recordCrash = (profile, trackId, total, coins) => {
  const previous = profile.best[trackId] ?? 0;
  const record = total > previous;
  const best = record ? Object.freeze({ ...profile.best, [trackId]: total }) : profile.best;
  return { profile: addCoins(freeze({ ...profile, best }), coins), record };
};

export const bestTotal = (profile) => Object.values(profile.best).reduce((max, value) => Math.max(max, value), 0);
