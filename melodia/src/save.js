// Formato do save na nuvem. Sempre validar: o dado pode vir de uma versao antiga ou corrompido.
import { CONFIG, SHOP_KIND } from './config.js';
import { createProfile, itemById } from './profile.js';
import { isTuneId } from './tunes.js';

const MAX_NUMBER = 1000000000;

const count = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.min(MAX_NUMBER, Math.floor(number)) : 0;
};

const uniqueIds = (value, isValid) =>
  (Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && isValid(id)))] : []);

const equippedOf = (value, owned) => {
  const pick = (kind) => {
    const id = value?.[kind];
    return typeof id === 'string' && owned.includes(id) && itemById(id).kind === kind ? id : null;
  };
  return { instrument: pick(SHOP_KIND.INSTRUMENT), frame: pick(SHOP_KIND.FRAME) };
};

export const serializeSave = (profile) => JSON.stringify({
  version: CONFIG.saveVersion,
  coins: profile.coins,
  xp: profile.xp,
  wins: profile.wins,
  matches: profile.matches,
  best: profile.best,
  streak: profile.streak,
  recent: profile.recent,
  owned: profile.owned,
  equipped: profile.equipped,
  adReady: profile.adReady,
});

export const parseSave = (raw) => {
  if (typeof raw !== 'string' || raw === '') return createProfile();
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return createProfile();
    const owned = uniqueIds(data.owned, (id) => Boolean(itemById(id)));
    const matches = count(data.matches);
    return {
      coins: count(data.coins),
      xp: count(data.xp),
      wins: Math.min(count(data.wins), matches),
      matches,
      best: Math.min(count(data.best), CONFIG.rounds * CONFIG.maxPoints),
      streak: Math.min(count(data.streak), matches),
      recent: uniqueIds(data.recent, isTuneId).slice(-CONFIG.recentLimit),
      owned,
      equipped: equippedOf(data.equipped, owned),
      adReady: data.adReady === true && matches > 0,
    };
  } catch {
    return createProfile();
  }
};
