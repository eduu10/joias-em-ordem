// Timbres do sintetizador e efeitos sonoros curtos. So numeros: quem toca e o synth.js.
// Cada timbre: osciladores [forma, multiplo da frequencia, volume, desafinacao em cents], envelope e filtro.
export const PRESETS = Object.freeze({
  piano: Object.freeze({
    oscs: [['triangle', 1, 0.5, 0], ['sine', 2, 0.16, 0], ['sine', 3, 0.05, 0]],
    attack: 0.006, decay: 1.5, sustain: 0, release: 0.12, cutoff: 3000, vibrato: 0, volume: 0.6,
  }),
  musicbox: Object.freeze({
    oscs: [['sine', 2, 0.5, 0], ['sine', 4, 0.14, 0], ['sine', 6.01, 0.05, 0]],
    attack: 0.003, decay: 1.1, sustain: 0, release: 0.2, cutoff: 6500, vibrato: 0, volume: 0.5,
  }),
  flute: Object.freeze({
    oscs: [['sine', 1, 0.55, 0], ['triangle', 2, 0.07, 0]],
    attack: 0.05, decay: 0, sustain: 1, release: 0.09, cutoff: 2600, vibrato: 5, volume: 0.55,
  }),
  strings: Object.freeze({
    oscs: [['sawtooth', 1, 0.2, -7], ['sawtooth', 1, 0.2, 7], ['sine', 1, 0.2, 0]],
    attack: 0.07, decay: 0, sustain: 1, release: 0.16, cutoff: 1900, vibrato: 3, volume: 0.6,
  }),
});

export const DEFAULT_PRESET = 'piano';

// Cada efeito: frequencia base, forma de onda, duracao, volume e notas [semitons, atraso em segundos].
export const SOUNDS = Object.freeze({
  tap: Object.freeze({ base: 520, type: 'sine', duration: 0.07, volume: 0.1, notes: [[0, 0]] }),
  ready: Object.freeze({ base: 392, type: 'triangle', duration: 0.12, volume: 0.1, notes: [[0, 0], [7, 0.1]] }),
  correct: Object.freeze({ base: 660, type: 'sine', duration: 0.2, volume: 0.16, notes: [[0, 0], [4, 0.08], [7, 0.16], [12, 0.24]] }),
  wrong: Object.freeze({ base: 196, type: 'sawtooth', duration: 0.26, volume: 0.1, notes: [[0, 0], [-1, 0.14]] }),
  timeout: Object.freeze({ base: 262, type: 'triangle', duration: 0.24, volume: 0.13, notes: [[0, 0], [-4, 0.16], [-7, 0.32]] }),
  rival: Object.freeze({ base: 880, type: 'square', duration: 0.05, volume: 0.035, notes: [[0, 0], [5, 0.06]] }),
  win: Object.freeze({ base: 523, type: 'triangle', duration: 0.26, volume: 0.15, notes: [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [16, 0.52]] }),
  tie: Object.freeze({ base: 440, type: 'triangle', duration: 0.24, volume: 0.13, notes: [[0, 0], [5, 0.15], [0, 0.3]] }),
  lose: Object.freeze({ base: 330, type: 'triangle', duration: 0.36, volume: 0.13, notes: [[0, 0], [-3, 0.22], [-7, 0.44]] }),
  coin: Object.freeze({ base: 988, type: 'sine', duration: 0.12, volume: 0.12, notes: [[0, 0], [5, 0.07]] }),
  deny: Object.freeze({ base: 150, type: 'square', duration: 0.1, volume: 0.06, notes: [[0, 0]] }),
});
