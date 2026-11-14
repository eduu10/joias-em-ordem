// Sons sintetizados (sem arquivos). Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
const SEMITONE = 2 ** (1 / 12);

// Cada som: frequencia base, forma de onda, duracao, volume e notas [semitons, atraso em segundos].
const SOUNDS = Object.freeze({
  shot: Object.freeze({ base: 620, type: 'triangle', duration: 0.06, volume: 0.045, notes: [[0, 0]] }),
  kill: Object.freeze({ base: 300, type: 'square', duration: 0.09, volume: 0.05, notes: [[0, 0], [7, 0.04]] }),
  buy: Object.freeze({ base: 440, type: 'sine', duration: 0.14, volume: 0.14, notes: [[0, 0], [7, 0.06]] }),
  merge: Object.freeze({ base: 523, type: 'sine', duration: 0.2, volume: 0.15, notes: [[0, 0], [4, 0.06], [7, 0.12], [12, 0.18]] }),
  move: Object.freeze({ base: 280, type: 'sine', duration: 0.08, volume: 0.1, notes: [[0, 0]] }),
  leak: Object.freeze({ base: 110, type: 'sawtooth', duration: 0.25, volume: 0.14, notes: [[0, 0]] }),
  wave: Object.freeze({ base: 392, type: 'triangle', duration: 0.18, volume: 0.13, notes: [[0, 0], [5, 0.12], [9, 0.24]] }),
  boss: Object.freeze({ base: 147, type: 'sawtooth', duration: 0.35, volume: 0.13, notes: [[0, 0], [-1, 0.2], [-5, 0.4]] }),
  clear: Object.freeze({ base: 523, type: 'sine', duration: 0.18, volume: 0.13, notes: [[0, 0], [7, 0.1], [12, 0.2]] }),
  over: Object.freeze({ base: 330, type: 'triangle', duration: 0.4, volume: 0.15, notes: [[0, 0], [-3, 0.25], [-7, 0.5], [-12, 0.75]] }),
  deny: Object.freeze({ base: 150, type: 'square', duration: 0.1, volume: 0.07, notes: [[0, 0]] }),
});

export const createAudio = (initiallyEnabled) => {
  let enabled = initiallyEnabled;
  let context = null;
  let paused = false;

  // Navegadores so liberam audio depois de um toque do jogador.
  const unlock = () => {
    if (!enabled) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!context && Ctor) context = new Ctor();
    // No celular o contexto pode nascer suspenso: tenta ligar de novo a cada toque.
    if (context && !paused && context.state === 'suspended') context.resume().catch(() => {});
  };

  const playNote = (sound, semitones, delay) => {
    const startAt = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = sound.type;
    osc.frequency.value = sound.base * SEMITONE ** semitones;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(sound.volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + sound.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(startAt + sound.duration + 0.02);
  };

  const play = (name, transpose = 0) => {
    if (!enabled || paused || !context || context.state !== 'running') return;
    const sound = SOUNDS[name];
    sound.notes.forEach(([semitones, delay]) => playNote(sound, semitones + transpose, delay));
  };

  // O contexto so roda com o som ligado no YouTube E o jogo fora de pausa.
  const sync = () => {
    if (!context) return;
    if (enabled && !paused) context.resume().catch(() => {});
    else context.suspend().catch(() => {});
  };

  const setEnabled = (value) => { enabled = value; sync(); };
  const suspend = () => { paused = true; sync(); };
  const resume = () => { paused = false; sync(); };

  return Object.freeze({ unlock, play, setEnabled, suspend, resume });
};
