// Sintetizador (sem arquivos de audio): toca as melodias com o relogio do WebAudio e os efeitos curtos.
// Obedece ao mudo do YouTube: se `enabled` for falso, nada toca.
import { DEFAULT_PRESET, PRESETS, SOUNDS } from './synth-presets.js';

const SEMITONE = 2 ** (1 / 12);
const A4_MIDI = 69;
const A4_HZ = 440;
const MASTER_VOLUME = 0.55;
const LOOKAHEAD_SECONDS = 0.3;
const SCHEDULER_MS = 40;
const START_DELAY = 0.06;
const GATE = 0.94;
const SILENT = 0.0001;
const SECONDS_PER_MINUTE = 60;
const FFT_SIZE = 1024;
const BARS = 16;
const TOP_HZ = 3600;

const hertz = (midi) => A4_HZ * SEMITONE ** (midi - A4_MIDI);

// Monta a saida: volume geral -> limitador suave -> analisador (para o equalizador da tela) -> caixas de som.
const buildOutput = (context) => {
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();
  const analyser = context.createAnalyser();
  master.gain.value = MASTER_VOLUME;
  limiter.threshold.value = -12;
  limiter.knee.value = 12;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.2;
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.7;
  master.connect(limiter).connect(analyser).connect(context.destination);
  return { master, analyser, bins: new Uint8Array(analyser.frequencyBinCount) };
};

// Uma nota do timbre dado, ligada em `bus`. Devolve os osciladores para poder cortar o som na hora.
const playVoice = (context, bus, preset, midi, startAt, seconds) => {
  const gain = context.createGain();
  const hold = Math.max(0.05, seconds * GATE);
  const endAt = preset.sustain > 0 ? startAt + hold + preset.release : startAt + Math.max(hold, 0.25) + preset.release;
  gain.gain.setValueAtTime(SILENT, startAt);
  gain.gain.exponentialRampToValueAtTime(preset.volume, startAt + preset.attack);
  if (preset.sustain > 0) {
    gain.gain.setValueAtTime(preset.volume, startAt + Math.max(preset.attack, hold));
  } else {
    gain.gain.setTargetAtTime(SILENT, startAt + preset.attack, preset.decay / 4);
    gain.gain.setValueAtTime(preset.volume * Math.exp((-4 * (endAt - preset.release - startAt)) / preset.decay), endAt - preset.release);
  }
  gain.gain.exponentialRampToValueAtTime(SILENT, endAt);
  gain.connect(bus);
  return preset.oscs.map(([type, multiple, volume, cents]) => {
    const osc = context.createOscillator();
    const level = context.createGain();
    osc.type = type;
    osc.frequency.value = hertz(midi) * multiple;
    osc.detune.value = cents + (preset.vibrato ? Math.sin(startAt * preset.vibrato) * 3 : 0);
    level.gain.value = volume;
    osc.connect(level).connect(gain);
    osc.start(startAt);
    osc.stop(endAt + 0.03);
    return osc;
  });
};

// Construtor do WebAudio, ou null num navegador sem suporte a som.
const audioCtor = () => (typeof window === 'undefined' ? null : window.AudioContext || window.webkitAudioContext || null);

export const createSynth = (initiallyEnabled) => {
  const supported = Boolean(audioCtor());
  let enabled = initiallyEnabled;
  let paused = false;
  let context = null;
  let output = null;
  let tune = null;
  let timer = 0;
  let broken = false;

  const ready = () => Boolean(context) && enabled && !paused && context.state === 'running';

  const silence = () => {
    if (!tune?.bus) return;
    const now = context.currentTime;
    tune.bus.gain.cancelScheduledValues(now);
    tune.bus.gain.setValueAtTime(0, now);
    tune.oscs.forEach((osc) => { try { osc.stop(now); } catch { /* ja parado */ } });
    tune.bus.disconnect();
    tune = { ...tune, bus: null, oscs: [] };
  };

  // Agenda as notas que comecam dentro da janela a frente. A melodia recomeca depois de um respiro.
  const schedule = () => {
    if (!tune || !ready()) return;
    if (!tune.bus) {
      const bus = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = tune.preset.cutoff;
      bus.connect(filter).connect(output.master);
      tune = { ...tune, bus, oscs: [], index: 0, nextAt: context.currentTime + START_DELAY };
    }
    const horizon = context.currentTime + LOOKAHEAD_SECONDS;
    while (tune.nextAt < horizon) {
      const note = tune.notes[tune.index];
      const seconds = note.beats * tune.beatSeconds;
      const oscs = note.midi === null ? [] : playVoice(context, tune.bus, tune.preset, note.midi, tune.nextAt, seconds);
      const last = tune.index + 1 >= tune.notes.length;
      tune = {
        ...tune,
        oscs: [...tune.oscs.slice(-24), ...oscs],
        index: last ? 0 : tune.index + 1,
        nextAt: tune.nextAt + seconds + (last ? tune.gapBeats * tune.beatSeconds : 0),
      };
    }
  };

  const stopTune = () => {
    clearInterval(timer);
    timer = 0;
    if (context) silence();
    tune = null;
  };

  // `piece`: { notes, tempo, preset, gapBeats }. Comeca sempre do inicio.
  const playTune = (piece) => {
    stopTune();
    tune = {
      notes: piece.notes,
      beatSeconds: SECONDS_PER_MINUTE / piece.tempo,
      preset: PRESETS[piece.preset] ?? PRESETS[DEFAULT_PRESET],
      gapBeats: piece.gapBeats,
      bus: null,
      oscs: [],
    };
    timer = setInterval(schedule, SCHEDULER_MS);
    schedule();
  };

  // O contexto so roda com o som ligado no YouTube E o jogo fora de pausa.
  const sync = () => {
    if (!context) return;
    if (enabled && !paused) context.resume().then(schedule).catch(() => {});
    else context.suspend().catch(() => {});
  };

  // Navegadores so liberam audio depois de um toque do jogador.
  const unlock = () => {
    if (!enabled) return;
    const Ctor = audioCtor();
    if (!context && Ctor) {
      try {
        context = new Ctor();
        output = buildOutput(context);
      } catch {
        // Alguns navegadores tem o construtor mas recusam criar o contexto: conta como sem som.
        context = null;
        output = null;
        broken = true;
      }
    }
    // No celular o contexto pode nascer suspenso: tenta ligar de novo a cada toque.
    if (context && !paused && context.state !== 'running') sync();
  };

  const playSound = (name, transpose = 0) => {
    if (!ready()) return;
    const sound = SOUNDS[name];
    sound.notes.forEach(([semitones, delay]) => {
      const startAt = context.currentTime + delay;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = sound.type;
      osc.frequency.value = sound.base * SEMITONE ** (semitones + transpose);
      gain.gain.setValueAtTime(SILENT, startAt);
      gain.gain.exponentialRampToValueAtTime(sound.volume, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(SILENT, startAt + sound.duration);
      osc.connect(gain).connect(output.master);
      osc.start(startAt);
      osc.stop(startAt + sound.duration + 0.02);
    });
  };

  // Volume por faixa de frequencia (0 a 1), para o equalizador. Lista vazia se nao ha som.
  const levels = () => {
    if (!ready()) return [];
    output.analyser.getByteFrequencyData(output.bins);
    const perBar = Math.max(1, Math.floor((TOP_HZ / (context.sampleRate / 2)) * output.bins.length / BARS));
    return Array.from({ length: BARS }, (_, bar) => {
      let sum = 0;
      for (let i = 0; i < perBar; i += 1) sum += output.bins[1 + bar * perBar + i] ?? 0;
      return sum / perBar / 255;
    });
  };

  // Mudo ou pausa cortam a melodia na hora, inclusive as notas ja agendadas.
  const setEnabled = (value) => {
    enabled = Boolean(value);
    if (!enabled) stopTune();
    sync();
  };
  const suspend = () => { paused = true; stopTune(); sync(); };
  const resume = () => { paused = false; sync(); };

  return Object.freeze({
    unlock, playTune, stopTune, playSound, levels, setEnabled, suspend, resume,
    isReady: ready,
    // Falso quando o navegador nao tem WebAudio (ou nao deixou criar o contexto): o jogo nao tem como tocar.
    isSupported: () => supported && !broken,
    // Relogio do audio em segundos, ou null se o som nao esta rodando. Parado em pausa e no mudo.
    clock: () => (ready() ? context.currentTime : null),
    isEnabled: () => enabled,
    isPlaying: () => Boolean(tune),
  });
};
