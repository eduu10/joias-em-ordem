// Junta as cantigas e transforma letra + partitura em notas com silaba, palavra e tempo de inicio.
import { RODA_SONGS } from './songs-roda.js';
import { FESTA_SONGS } from './songs-festa.js';

const SEMITONE_OF = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });
const NOTE_PATTERN = /^([A-G])([#b]?)(\d)$/;
const PUNCTUATION = /[.,;:!?()"]/g;
const SECONDS_PER_MINUTE = 60;

// "C4" -> 60. "R" (pausa) -> null.
export const midiOf = (name) => {
  if (name === 'R') return null;
  const match = NOTE_PATTERN.exec(name);
  if (!match) throw new Error(`nota invalida: ${name}`);
  const shift = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + SEMITONE_OF[match[1]] + shift;
};

const parseScore = (score, unit) => score.trim().split(/\s+/).map((token) => {
  const [name, beats] = token.split(':');
  return { midi: midiOf(name), beats: beats === undefined ? unit : Number(beats) };
});

// Cada palavra: lista de silabas. '_' vira espaco (elisao cantada numa silaba so); '~' no comeco vira hifen.
const parseLyric = (lyric) => lyric.trim().split(/\s+/).map((word) => word.split('-').map((syl) => syl.replaceAll('_', ' ').replace(/^~/, '-')));

export const labelOf = (text) => text.replace(PUNCTUATION, '').trim();

export const buildSong = (raw) => {
  // Pausas nao tem silaba: viram silencio antes da nota cantada seguinte.
  const pitches = [];
  let pendingRest = 0;
  parseScore(raw.score, raw.unit).forEach((token) => {
    if (token.midi === null) pendingRest += token.beats;
    else {
      pitches.push({ ...token, restBefore: pendingRest });
      pendingRest = 0;
    }
  });
  const lyricWords = parseLyric(raw.lyric);
  const syllables = lyricWords.flatMap((syls, word) => syls.map((text, index) => ({ text, word, index, count: syls.length })));
  if (syllables.length !== pitches.length) {
    throw new Error(`${raw.id}: ${syllables.length} silabas para ${pitches.length} notas`);
  }
  const beatSeconds = SECONDS_PER_MINUTE / raw.tempo;
  let clock = 0;
  const notes = pitches.map((pitch, i) => {
    const syl = syllables[i];
    clock += pitch.restBefore * beatSeconds;
    const note = Object.freeze({
      midi: pitch.midi,
      beats: pitch.beats,
      restBefore: pitch.restBefore,
      start: clock,
      seconds: pitch.beats * beatSeconds,
      syl: syl.text,
      word: syl.word,
      wordStart: syl.index === 0,
      wordEnd: syl.index === syl.count - 1,
    });
    clock += pitch.beats * beatSeconds;
    return note;
  });
  const words = lyricWords.map((syls, index) => {
    const first = notes.findIndex((note) => note.word === index);
    const last = first + syls.length - 1;
    const text = syls.join('');
    return Object.freeze({ text, label: labelOf(text), first, last, start: notes[first].start });
  });
  return Object.freeze({
    id: raw.id,
    title: raw.title,
    source: raw.source,
    tempo: raw.tempo,
    preset: raw.preset,
    notes: Object.freeze(notes),
    words: Object.freeze(words),
    stops: Object.freeze(raw.stops.map((stop) => Object.freeze({ word: stop.word, wrong: Object.freeze([...stop.wrong]) }))),
    seconds: clock,
  });
};

// Ordem = ordem de desbloqueio por nivel.
const ORDER = Object.freeze([
  'ciranda', 'balao', 'cravo', 'pirulito', 'atirei', 'canoa', 'sambalele', 'piao',
  'borboleta', 'bahia', 'barata', 'menino', 'galinhas', 'zabelinha', 'trevo',
]);
const ALL = [...RODA_SONGS, ...FESTA_SONGS].map(buildSong);

export const SONGS = Object.freeze(ORDER.map((id) => ALL.find((song) => song.id === id)).filter(Boolean));
const BY_ID = new Map(SONGS.map((song) => [song.id, song]));

export const songById = (id) => BY_ID.get(id) ?? null;
export const isSongId = (id) => BY_ID.has(id);

// Notas para o sintetizador, da nota `from` ate `to` (inclusive), com as pausas no meio.
export const playbackNotes = (song, from, to) => song.notes.slice(from, to + 1).flatMap((note, k) => {
  const sound = { midi: note.midi, beats: note.beats };
  return k > 0 && note.restBefore > 0 ? [{ midi: null, beats: note.restBefore }, sound] : [sound];
});
