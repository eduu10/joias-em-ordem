// Sons sintetizados (sem arquivos). Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
const SEMITONE = 2 ** (1 / 12);
const VOLUME = 0.16;

// Cada som e uma lista de notas: [semitons acima da base, atraso em segundos].
const SOUNDS = Object.freeze({
  pick: Object.freeze({ base: 520, type: 'sine', duration: 0.09, notes: [[0, 0]] }),
  place: Object.freeze({ base: 300, type: 'triangle', duration: 0.12, notes: [[0, 0], [7, 0.03]] }),
  back: Object.freeze({ base: 260, type: 'sine', duration: 0.1, notes: [[0, 0]] }),
  jar: Object.freeze({ base: 523, type: 'sine', duration: 0.22, notes: [[0, 0], [4, 0.07], [7, 0.14], [12, 0.21]] }),
  win: Object.freeze({ base: 392, type: 'triangle', duration: 0.42, notes: [[0, 0], [4, 0.1], [7, 0.2], [12, 0.3], [16, 0.42]] }),
  hint: Object.freeze({ base: 660, type: 'sine', duration: 0.16, notes: [[0, 0], [5, 0.09]] }),
  deny: Object.freeze({ base: 150, type: 'square', duration: 0.12, notes: [[0, 0]] }),
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
    gain.gain.exponentialRampToValueAtTime(VOLUME, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + sound.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(startAt + sound.duration + 0.02);
  };

  const play = (name, transpose = 0) => {
    if (!enabled || !context || context.state !== 'running') return;
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
