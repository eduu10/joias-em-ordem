// Junta todas as melodias e transforma o texto de cada uma em notas { midi, beats }.
import { CATEGORY } from './config.js';
import { CLASSICAL_TUNES } from './tunes-classical.js';
import { STAGE_TUNES } from './tunes-stage.js';
import { FOLK_TUNES } from './tunes-folk.js';
import { CANTIGA_TUNES } from './tunes-cantigas.js';

const SEMITONE_OF = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });
const NOTE_PATTERN = /^([A-G])([#b]?)(\d)$/;
const SECONDS_PER_MINUTE = 60;

// "C4" -> 60. Devolve null para pausa ("R").
export const midiOf = (name) => {
  if (name === 'R') return null;
  const match = NOTE_PATTERN.exec(name);
  if (!match) throw new Error(`nota invalida: ${name}`);
  const shift = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + SEMITONE_OF[match[1]] + shift;
};

export const parseScore = (score, unit) =>
  Object.freeze(score.trim().split(/\s+/).map((token) => {
    const [name, beats] = token.split(':');
    return Object.freeze({ midi: midiOf(name), beats: beats === undefined ? unit : Number(beats) });
  }));

const build = (tune) => Object.freeze({
  id: tune.id,
  pt: tune.pt,
  en: tune.en,
  composer: tune.composer,
  category: tune.category,
  tempo: tune.tempo,
  preset: tune.preset,
  notes: parseScore(tune.score, tune.unit),
});

export const TUNES = Object.freeze(
  [...CLASSICAL_TUNES, ...STAGE_TUNES, ...FOLK_TUNES, ...CANTIGA_TUNES].map(build),
);

const BY_ID = new Map(TUNES.map((tune) => [tune.id, tune]));

export const tuneById = (id) => BY_ID.get(id) ?? null;
export const isTuneId = (id) => BY_ID.has(id);

// "mix" (tudo misturado) vale todas as melodias.
export const tunesIn = (category) =>
  (category === CATEGORY.MIX ? TUNES : TUNES.filter((tune) => tune.category === category));

export const tuneBeats = (tune) => tune.notes.reduce((sum, note) => sum + note.beats, 0);
export const tuneSeconds = (tune) => (tuneBeats(tune) * SECONDS_PER_MINUTE) / tune.tempo;

export const tuneTitle = (tune, lang) => (lang === 'pt' ? tune.pt : tune.en);
