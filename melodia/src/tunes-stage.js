// Melodias de opera e bale. Todas de compositores mortos antes de 1925 (dominio publico).
export const STAGE_TUNES = Object.freeze([
  {
    id: 'william-tell', pt: 'Guilherme Tell (Abertura)', en: 'William Tell Overture', composer: 'Gioachino Rossini',
    tempo: 150, preset: 'strings', unit: 0.25,
    score: 'B3 B3 B3:.5 B3 B3 B3:.5 B3 B3 E4:.5 F#4:.5 G#4:.5 B3 B3 B3:.5 B3 B3 E4:.5 G#4:.5 G#4:.5 F#4:.5 D#4:.5 '
      + 'B3 B3 B3:.5 B3 B3 B3:.5 B3 B3 E4:.5 F#4:.5 G#4:.5 B3 B3 B3:.5 B3 B3 E4:.5 G#4:.5 G#4:.5 F#4:.5 D#4:.5',
  },
  {
    id: 'can-can', pt: 'Cancã (Orfeu no Inferno)', en: 'Can-Can (Orpheus in the Underworld)', composer: 'Jacques Offenbach',
    tempo: 152, preset: 'piano', unit: 0.5,
    score: 'C4:2 D4 F4 E4 D4 G4:1 G4:1 G4 A4 E4 F4 D4:1 D4:1 D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 C4:2',
  },
  {
    id: 'toreador', pt: 'Canção do Toreador (Carmen)', en: 'Toreador Song (Carmen)', composer: 'Georges Bizet',
    tempo: 112, preset: 'strings', unit: 1,
    score: 'C5 D5:.75 C5:.25 A4 A4 A4:.75 G4:.25 A4:.75 Bb4:.25 A4:2 Bb4 G4:.75 C5:.25 A4:2 F4 D4:.75 G4:.25 C4:2',
  },
  {
    id: 'bridal-chorus', pt: 'Marcha Nupcial (Lohengrin)', en: 'Bridal Chorus (Lohengrin)', composer: 'Richard Wagner',
    tempo: 84, preset: 'strings', unit: 1,
    score: 'G4 C5:.75 C5:.25 C5:2 G4 D5:.75 B4:.25 C5:2 G4 C5:.75 F5:.25 F5 E5:.75 D5:.25 C5 B4:.75 C5:.25 D5:2',
  },
  {
    id: 'valkyries', pt: 'Cavalgada das Valquírias', en: 'Ride of the Valkyries', composer: 'Richard Wagner',
    tempo: 150, preset: 'strings', unit: 0.5,
    score: 'B4:.75 F#4:.25 B4 D5:1.5 B4:1.5 D5:.75 B4:.25 D5 F#5:1.5 D5:1.5 '
      + 'F#5:.75 D5:.25 F#5 A5:1.5 A4:1.5 D5:.75 A4:.25 D5 F#5:3',
  },
  {
    id: 'swan-lake', pt: 'O Lago dos Cisnes', en: 'Swan Lake', composer: 'Piotr Ilitch Tchaikovsky',
    tempo: 84, preset: 'flute', unit: 0.5,
    score: 'F#5:2 B4 C#5 D5 E5 F#5:1.5 D5 F#5:1.5 D5 F#5:1.5 B4 D5 B4 G4 D5 B4:4',
  },
  {
    id: 'sugar-plum', pt: 'Dança da Fada Açucarada', en: 'Dance of the Sugar Plum Fairy', composer: 'Piotr Ilitch Tchaikovsky',
    tempo: 76, preset: 'musicbox', unit: 0.5,
    score: 'G5 E5 G5 F#5 D#5 E5 D5:.25 D5:.25 D5 C#5:.25 C#5:.25 C#5 C5:.25 C5:.25 C5 B4 E5 C5 E5 B4:2',
  },
].map((tune) => Object.freeze({ ...tune, category: 'stage' })));
