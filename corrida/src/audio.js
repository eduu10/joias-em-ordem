// Sons sintetizados (sem arquivos). Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
const SEMITONE = 2 ** (1 / 12);

// Cada som: frequencia base, forma de onda, duracao, volume, notas [semitons, atraso em segundos]
// e `bend`: quantos semitons a nota escorrega ate o fim (0 = nota parada).
const sound = (base, type, duration, volume, notes, bend = 0) =>
  Object.freeze({ base, type, duration, volume, notes, bend });

const SOUNDS = Object.freeze({
  start: sound(392, 'triangle', 0.14, 0.12, [[0, 0], [7, 0.08], [12, 0.16]]),
  lane: sound(540, 'sine', 0.07, 0.07, [[0, 0]], 5),
  bump: sound(150, 'square', 0.07, 0.05, [[0, 0]]),
  jump: sound(300, 'triangle', 0.2, 0.11, [[0, 0]], 10),
  land: sound(150, 'sine', 0.08, 0.1, [[0, 0]], -6),
  slide: sound(230, 'sawtooth', 0.26, 0.045, [[0, 0]], -9),
  coin: sound(988, 'sine', 0.09, 0.085, [[0, 0], [5, 0.045]]),
  power: sound(523, 'triangle', 0.16, 0.12, [[0, 0], [4, 0.06], [7, 0.12], [12, 0.18]]),
  shield: sound(420, 'square', 0.3, 0.07, [[0, 0], [-5, 0.05]], -14),
  crash: sound(170, 'sawtooth', 0.45, 0.16, [[0, 0], [-7, 0.03]], -16),
  over: sound(330, 'triangle', 0.32, 0.12, [[0, 0.5], [-3, 0.72], [-7, 0.94]]),
  revive: sound(440, 'sine', 0.2, 0.13, [[0, 0], [5, 0.08], [9, 0.16], [12, 0.24]]),
  milestone: sound(660, 'sine', 0.14, 0.1, [[0, 0], [4, 0.08], [7, 0.16]]),
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

  const playNote = (spec, semitones, delay) => {
    const startAt = context.currentTime + delay;
    const endAt = startAt + spec.duration;
    const frequency = spec.base * SEMITONE ** semitones;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(frequency, startAt);
    if (spec.bend !== 0) osc.frequency.exponentialRampToValueAtTime(frequency * SEMITONE ** spec.bend, endAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(spec.volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  };

  const play = (name, transpose = 0) => {
    if (!enabled || paused || !context || context.state !== 'running') return;
    const spec = SOUNDS[name];
    if (!spec) return;
    spec.notes.forEach(([semitones, delay]) => playNote(spec, semitones + transpose, delay));
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
