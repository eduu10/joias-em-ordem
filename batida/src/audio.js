// Sons sintetizados (sem arquivos). Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
const SEMITONE = 2 ** (1 / 12);

// Tons: frequencia base, forma de onda, duracao, volume e notas [semitons, atraso em segundos].
const TONES = Object.freeze({
  click: Object.freeze({ base: 660, type: 'triangle', duration: 0.06, volume: 0.08, notes: [[0, 0]] }),
  buy: Object.freeze({ base: 523, type: 'sine', duration: 0.16, volume: 0.14, notes: [[0, 0], [4, 0.07], [7, 0.14]] }),
  deny: Object.freeze({ base: 150, type: 'square', duration: 0.1, volume: 0.07, notes: [[0, 0], [-2, 0.08]] }),
  coin: Object.freeze({ base: 988, type: 'square', duration: 0.07, volume: 0.05, notes: [[0, 0], [5, 0.06]] }),
  record: Object.freeze({ base: 523, type: 'triangle', duration: 0.2, volume: 0.13, notes: [[0, 0], [4, 0.1], [7, 0.2], [12, 0.3]] }),
  launch: Object.freeze({ base: 98, type: 'sawtooth', duration: 0.5, volume: 0.07, notes: [[0, 0], [5, 0.25], [10, 0.5], [15, 0.75]] }),
});

// Ruidos filtrados: frequencia do filtro, tipo, duracao, volume.
const NOISES = Object.freeze({
  impact: Object.freeze({ freq: 700, filter: 'lowpass', duration: 0.6, volume: 0.6 }),
  hit: Object.freeze({ freq: 1100, filter: 'lowpass', duration: 0.2, volume: 0.25 }),
  glass: Object.freeze({ freq: 5200, filter: 'highpass', duration: 0.45, volume: 0.22 }),
  scrape: Object.freeze({ freq: 2600, filter: 'bandpass', duration: 0.12, volume: 0.06 }),
  whoosh: Object.freeze({ freq: 900, filter: 'bandpass', duration: 0.5, volume: 0.16 }),
  part: Object.freeze({ freq: 1800, filter: 'bandpass', duration: 0.25, volume: 0.2 }),
});

export const createAudio = (initiallyEnabled) => {
  let enabled = initiallyEnabled;
  let context = null;
  let paused = false;
  let noiseBuffer = null;

  // Navegadores so liberam audio depois de um toque do jogador.
  const unlock = () => {
    if (!enabled) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!context && Ctor) context = new Ctor();
    // No celular o contexto pode nascer suspenso: tenta ligar de novo a cada toque.
    if (context && !paused && context.state === 'suspended') context.resume().catch(() => {});
  };

  const envelope = (gain, startAt, volume, duration) => {
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  };

  const playNote = (sound, semitones, delay) => {
    const startAt = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = sound.type;
    osc.frequency.value = sound.base * SEMITONE ** semitones;
    envelope(gain, startAt, sound.volume, sound.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(startAt + sound.duration + 0.02);
  };

  const ensureNoise = () => {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(context.sampleRate * 0.8);
    noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < length; i += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      data[i] = (seed / 1073741824 - 1) * (1 - i / length);
    }
    return noiseBuffer;
  };

  const playNoise = (sound, strength) => {
    const startAt = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = ensureNoise();
    const filter = context.createBiquadFilter();
    filter.type = sound.filter;
    filter.frequency.value = sound.freq;
    const gain = context.createGain();
    envelope(gain, startAt, Math.max(0.001, sound.volume * strength), sound.duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(startAt);
    source.stop(startAt + sound.duration + 0.02);
  };

  // Batida forte: ruido grave mais um baque.
  const thud = (strength) => playNote({ base: 55, type: 'sine', duration: 0.35, volume: 0.35 * strength }, 0, 0);

  const ready = () => enabled && !paused && context && context.state === 'running';

  const play = (name, strength = 1) => {
    if (!ready()) return;
    const level = Math.min(1, Math.max(0.15, strength));
    if (NOISES[name]) {
      playNoise(NOISES[name], level);
      if (name === 'impact') thud(level);
      return;
    }
    const sound = TONES[name];
    if (sound) sound.notes.forEach(([semitones, delay]) => playNote(sound, semitones, delay));
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
