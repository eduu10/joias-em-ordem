// Sons sintetizados (sem arquivos). Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
const SEMITONE = 2 ** (1 / 12);

// Cada som: frequencia base, forma de onda, duracao, volume e notas [semitons, atraso em segundos].
const SOUNDS = Object.freeze({
  start: Object.freeze({ base: 523, type: 'sine', duration: 0.22, volume: 0.12, notes: [[0, 0], [7, 0.08], [12, 0.16]] }),
  pick: Object.freeze({ base: 740, type: 'sine', duration: 0.07, volume: 0.07, notes: [[0, 0]] }),
  place: Object.freeze({ base: 196, type: 'triangle', duration: 0.1, volume: 0.16, notes: [[0, 0], [12, 0.03]] }),
  back: Object.freeze({ base: 233, type: 'sine', duration: 0.1, volume: 0.09, notes: [[0, 0], [-5, 0.07]] }),
  clear: Object.freeze({ base: 784, type: 'triangle', duration: 0.24, volume: 0.1, notes: [[0, 0], [4, 0.06], [7, 0.12], [12, 0.18]] }),
  multi: Object.freeze({ base: 1047, type: 'sine', duration: 0.3, volume: 0.09, notes: [[0, 0.2], [4, 0.26], [7, 0.32], [12, 0.38]] }),
  shard: Object.freeze({ base: 2093, type: 'sine', duration: 0.09, volume: 0.035, notes: [[0, 0.05], [5, 0.11], [-2, 0.17], [7, 0.23]] }),
  revive: Object.freeze({ base: 392, type: 'triangle', duration: 0.26, volume: 0.12, notes: [[0, 0], [5, 0.09], [9, 0.18], [12, 0.27], [17, 0.36]] }),
  over: Object.freeze({ base: 330, type: 'triangle', duration: 0.4, volume: 0.14, notes: [[0, 0], [-3, 0.25], [-7, 0.5], [-12, 0.75]] }),
});

export const createAudio = (initiallyEnabled) => {
  let enabled = initiallyEnabled;
  let context = null;
  let paused = false;

  // Navegadores so liberam audio depois de um toque do jogador.
  const unlock = () => {
    if (context || !enabled) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) context = new Ctor();
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
    if (!enabled || !context || context.state !== 'running') return;
    const sound = SOUNDS[name];
    if (!sound) return;
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
