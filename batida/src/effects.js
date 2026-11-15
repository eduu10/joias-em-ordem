// Traduz eventos da simulacao em efeitos visuais e sons. Devolve um `ui` novo.
import { CONFIG } from './config.js';
import { EVENT } from './sim.js';
import { floatText, glassShards, smoke, sparks } from './fx.js';

const SOUND_GAP = 0.08;
const S = CONFIG.score;

const withFx = (ui, items) => ({ ...ui, fx: [...ui.fx, ...items] });

const banner = (text, color) => ({ text, color, t: 0 });

/**
 * @param {object} ui estado visual atual
 * @param {object[]} events eventos de stepRun
 * @param {object} env { rand, strings, audio (ou null no demo), vx velocidade do carro }
 */
export const applyEvents = (ui, events, env) => events.reduce((current, event) => {
  const { rand, strings, audio } = env;
  const sound = (name, strength) => {
    if (audio && current.soundT <= 0) audio.play(name, strength);
  };
  switch (event.type) {
    case EVENT.IMPACT: {
      const strength = Math.min(1, event.power / 25);
      audio?.play('impact', strength);
      return {
        ...withFx(current, [
          ...sparks(rand, event.x, event.y, 22, 1.2), ...smoke(rand, event.x, event.y, 10, true), ...smoke(rand, event.x, -0.1, 8),
        ]),
        shake: Math.max(current.shake, 0.4 + strength * 0.6),
        flash: 0.4 + strength * 0.6,
        banner: banner(strings.impact, '#ffffff'),
      };
    }
    case EVENT.HIT:
      sound('hit', event.power / 20);
      return { ...withFx(current, sparks(rand, event.x, event.y, 6, 0.8)), shake: Math.max(current.shake, Math.min(0.6, event.power / 30)), soundT: SOUND_GAP };
    case EVENT.SCRAPE:
      sound('scrape', 0.6);
      return { ...withFx(current, sparks(rand, event.x, event.y, 3, 0.6)), soundT: SOUND_GAP };
    case EVENT.DETACH:
      audio?.play('part', 0.8);
      return withFx(current, [...smoke(rand, event.x, event.y, 4, true), floatText(event.x, event.y - 1, `+${S.part}`)]);
    case EVENT.GLASS:
      audio?.play('glass', 1);
      return withFx(current, [...glassShards(rand, event.x, event.y, env.vx), floatText(event.x, event.y - 1.4, `+${S.glass}`, '#bff0ff')]);
    case EVENT.EJECT:
      audio?.play('whoosh', 1);
      return {
        ...withFx(current, [floatText(event.x, event.y - 1, `+${S.eject}`, '#ff8a3d')]),
        banner: banner(strings.eject, '#ffd21f'),
      };
    default:
      return current;
  }
}, ui);
