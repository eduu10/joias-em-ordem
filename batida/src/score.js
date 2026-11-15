// Pontuacao de um teste a partir do estado final da simulacao. Pura.
import { CONFIG } from './config.js';
import { totalStrain } from './carbody.js';

export const damagePercent = (strain, damageRef) => Math.min(100, Math.round(100 * (1 - Math.exp(-strain / damageRef))));

export const flipsOf = (rot) => Math.floor((Math.abs(rot) + 0.3) / (2 * Math.PI));

/**
 * @param {object} run estado do teste (sim.js)
 * @returns {object} componentes da pontuacao e o total
 */
export const scoreRun = (run) => {
  const S = CONFIG.score;
  const damagePct = damagePercent(totalStrain(run.world.bodies[0]), run.car.damageRef);
  const parts = run.stats.parts;
  const ejected = run.stats.ejected;
  const distance = run.world.dummies.reduce((sum, d) => sum + (d.attached ? 0 : d.farthest), 0);
  const flips = flipsOf(run.stats.rot);
  const air = run.stats.air >= S.minAir ? run.stats.air : 0;
  const lines = {
    damage: damagePct * S.damage,
    parts: parts * S.part,
    glass: run.stats.glass ? S.glass : 0,
    eject: ejected * S.eject,
    distance: Math.round(distance * S.perMeter),
    flips: flips * S.flip,
    air: Math.round(air * S.airPerSecond),
  };
  const total = Math.min(CONFIG.maxScore, Object.values(lines).reduce((a, b) => a + b, 0));
  return { damagePct, parts, ejected, distance, flips, air, lines, total };
};

export const coinsFor = (total) => Math.max(0, Math.floor(total / CONFIG.coinDivisor));
