// Formato do save na nuvem. Sempre validar: o dado pode vir de uma versao antiga ou corrompido.
import { CONFIG } from './config.js';

const MAX_HINTS = 999;

const defaults = () => ({ level: 1, hints: CONFIG.startingHints });

const wholeNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
};

export const serializeSave = ({ level, hints }) =>
  JSON.stringify({ version: CONFIG.saveVersion, level, hints });

export const parseSave = (raw) => {
  if (typeof raw !== 'string' || raw === '') return defaults();
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return defaults();
    const base = defaults();
    return {
      level: wholeNumber(data.level, 1, Number.MAX_SAFE_INTEGER, base.level),
      hints: wholeNumber(data.hints, 0, MAX_HINTS, base.hints),
    };
  } catch {
    return defaults();
  }
};
