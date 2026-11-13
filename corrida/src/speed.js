// Curvas que dependem so da distancia percorrida: velocidade e dificuldade.
import { CONFIG } from './config.js';

export const speedAt = (distance) =>
  Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + Math.max(0, distance) * CONFIG.speedPerMeter);

// 0 no comeco, 1 quando a pista esta no mais dificil.
export const difficultyAt = (distance) =>
  Math.min(1, Math.max(0, distance) / CONFIG.difficultyMeters);

// Espaco entre duas fileiras de obstaculos, em metros. Sempre da tempo de reagir.
export const gapAt = (distance) => {
  const d = difficultyAt(distance);
  const seconds = CONFIG.gapSecondsEasy + (CONFIG.gapSecondsHard - CONFIG.gapSecondsEasy) * d;
  return speedAt(distance) * seconds;
};
