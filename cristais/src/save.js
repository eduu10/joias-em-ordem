// Formato do save na nuvem. Sempre validar: o dado pode vir de uma versao antiga ou corrompido.
import { CONFIG } from './config.js';

export const serializeSave = (best) => JSON.stringify({ version: CONFIG.saveVersion, best });

export const parseSave = (raw) => {
  if (typeof raw !== 'string' || raw === '') return { best: 0 };
  try {
    const data = JSON.parse(raw);
    const best = Number(data?.best);
    if (!Number.isFinite(best) || best <= 0) return { best: 0 };
    return { best: Math.min(CONFIG.maxScore, Math.floor(best)) };
  } catch {
    return { best: 0 };
  }
};
