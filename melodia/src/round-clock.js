// Relogio da partida: mede o tempo real que passou entre dois quadros, para a rodada nao atrasar
// quando o quadro demora (o passo do desenho e limitado a CONFIG.maxFrameSeconds, este nao).
// Funcoes puras: recebem o relogio e a hora atual e devolvem um relogio novo mais os segundos passados.
import { CONFIG } from './config.js';

// Relogio parado: o proximo `tickClock` so marca a hora e devolve zero.
export const heldClock = () => Object.freeze({ source: null, last: null });

/**
 * @param {{source: string|null, last: number|null}} clock
 * @param {string} source de onde vem a hora ("audio" ou "page"); trocar de fonte recomeca a contagem
 * @param {number} now hora atual em segundos, na fonte dada
 * @returns {{clock: {source: string|null, last: number|null}, dt: number}}
 */
export const tickClock = (clock, source, now) => {
  if (!Number.isFinite(now)) return { clock: heldClock(), dt: 0 };
  const next = Object.freeze({ source, last: now });
  if (clock.last === null || clock.source !== source || now < clock.last) return { clock: next, dt: 0 };
  return { clock: next, dt: Math.min(CONFIG.roundClockMaxStep, now - clock.last) };
};
