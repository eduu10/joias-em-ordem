// Formato do save na nuvem. Sempre validar: o dado pode vir de uma versao antiga, corrompido ou com ids que nao existem.
import { CONFIG } from './config.js';
import { isSongId } from './songs.js';

const MAX_SCORE = 10000000;
const MAX_LEVEL = 1000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const emptySave = () => ({ best: 0, bestLevel: 1, dailyDate: '', dailyScore: 0, songs: [] });

const whole = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min ? Math.min(max, Math.floor(n)) : fallback;
};

export const serializeSave = (save) => JSON.stringify({ version: CONFIG.saveVersion, ...save });

export const parseSave = (raw) => {
  if (typeof raw !== 'string' || raw === '') return emptySave();
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return emptySave();
    const dailyDate = typeof data.dailyDate === 'string' && DATE_KEY.test(data.dailyDate) ? data.dailyDate : '';
    const songs = Array.isArray(data.songs) ? [...new Set(data.songs.filter((id) => typeof id === 'string' && isSongId(id)))] : [];
    return {
      best: whole(data.best, 0, MAX_SCORE, 0),
      bestLevel: whole(data.bestLevel, 1, MAX_LEVEL, 1),
      dailyDate,
      dailyScore: dailyDate ? whole(data.dailyScore, 0, MAX_SCORE, 0) : 0,
      songs,
    };
  } catch {
    return emptySave();
  }
};

// Junta o resultado de uma partida ao save, sem alterar o original.
export const applyRun = (save, game) => {
  const songs = [...new Set([...save.songs, ...game.used, ...(game.daily ?? []).map((round) => round.songId)])].filter(isSongId);
  const next = { ...save, best: Math.max(save.best, game.score), bestLevel: Math.max(save.bestLevel, game.level), songs };
  return game.mode === 'daily' ? { ...next, dailyDate: game.dateKey, dailyScore: game.score } : next;
};
