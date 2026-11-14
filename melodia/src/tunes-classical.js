// Melodias de concerto. Todas de compositores mortos antes de 1925 (dominio publico).
// `score`: notas separadas por espaco, "Nota[:tempos]". Sem ":tempos" vale `unit`. "R" e pausa.
export const CLASSICAL_TUNES = Object.freeze([
  {
    id: 'ode-joy', pt: 'Ode à Alegria', en: 'Ode to Joy', composer: 'Ludwig van Beethoven',
    tempo: 138, preset: 'strings', unit: 1,
    score: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 '
      + 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2',
  },
  {
    id: 'fur-elise', pt: 'Para Elisa', en: 'Für Elise', composer: 'Ludwig van Beethoven',
    tempo: 130, preset: 'piano', unit: 0.5,
    score: 'E5 D#5 E5 D#5 E5 B4 D5 C5 A4:1.5 C4 E4 A4 B4:1.5 E4 G#4 B4 C5:1.5 E4 E5 D#5 '
      + 'E5 D#5 E5 B4 D5 C5 A4:1.5 C4 E4 A4 B4:1.5 E4 C5 B4 A4:2',
  },
  {
    id: 'symphony-5', pt: 'Sinfonia n.º 5', en: 'Symphony No. 5', composer: 'Ludwig van Beethoven',
    tempo: 200, preset: 'strings', unit: 0.5,
    score: 'G4 G4 G4 Eb4:4 R F4 F4 F4 D4:5 R G4 G4 G4 Eb4 Ab4 Ab4 Ab4 G4 Eb5 Eb5 Eb5 C5:2 '
      + 'R G4 G4 G4 D4 Ab4 Ab4 Ab4 G4 F5 F5 F5 D5:3',
  },
  {
    id: 'nachtmusik', pt: 'Pequena Serenata Noturna', en: 'Eine kleine Nachtmusik', composer: 'Wolfgang Amadeus Mozart',
    tempo: 132, preset: 'strings', unit: 0.5,
    score: 'G4:1 R D4 G4:1 R D4 G4 D4 G4 B4 D5:1 R:1 C5:1 R A4 C5:1 R A4 C5 A4 F#4 A4 D4:2',
  },
  {
    id: 'alla-turca', pt: 'Marcha Turca', en: 'Turkish March (Rondo alla Turca)', composer: 'Wolfgang Amadeus Mozart',
    tempo: 126, preset: 'piano', unit: 0.25,
    score: 'B4 A4 G#4 A4 C5:.5 R:.5 D5 C5 B4 C5 E5:.5 R:.5 F5 E5 D#5 E5 B5 A5 G#5 A5 B5 A5 G#5 A5 '
      + 'C6:1 A5:.5 C6:.5 B5:.5 A5:.5 G5:.5 A5:.5 B5:.5 A5:.5 G5:.5 A5:.5 B5:.5 A5:.5 G5:.5 F#5:.5 E5:2',
  },
  {
    id: 'minuet-g', pt: 'Minueto em Sol maior', en: 'Minuet in G major', composer: 'Christian Petzold',
    tempo: 132, preset: 'piano', unit: 0.5,
    score: 'D5:1 G4 A4 B4 C5 D5:1 G4:1 G4:1 E5:1 C5 D5 E5 F#5 G5:1 G4:1 G4:1 '
      + 'C5:1 D5 C5 B4 A4 B4:1 C5 B4 A4 G4 F#4:1 G4 A4 B4 G4 A4:3',
  },
  {
    id: 'jesu-joy', pt: 'Jesus, Alegria dos Homens', en: 'Jesu, Joy of Man\'s Desiring', composer: 'Johann Sebastian Bach',
    tempo: 96, preset: 'flute', unit: 0.5,
    score: 'G4 A4 B4 D5 C5 C5 E5 D5 D5 G5 F#5 G5 D5 B4 G4 A4 B4 C5 D5 E5 D5 C5 B4 A4 B4 G4 '
      + 'F#4 G4 A4 D4 F#4 A4 C5 B4 A4 B4:2',
  },
  {
    id: 'toccata-d', pt: 'Tocata e Fuga em Ré menor', en: 'Toccata and Fugue in D minor', composer: 'Johann Sebastian Bach',
    tempo: 120, preset: 'strings', unit: 0.25,
    score: 'A5 G5 A5:2.5 R:.5 G5 F5 E5 D5 C#5:1 D5:2 R:1 A4 G4 A4:2.5 R:.5 E4:.5 F4:.5 C#4:1 D4:2 R:1 '
      + 'A3 G3 A3:2.5 R:.5 G3 F3 E3 D3 C#3:1 D3:2',
  },
  {
    id: 'spring', pt: 'A Primavera (As Quatro Estações)', en: 'Spring (The Four Seasons)', composer: 'Antonio Vivaldi',
    tempo: 100, preset: 'strings', unit: 0.5,
    score: 'E4 G#4 G#4 G#4 F#4:.25 E4:.25 B4:1.5 B4:.25 A4:.25 G#4 G#4 G#4 F#4:.25 E4:.25 B4:1.5 B4:.25 A4:.25 '
      + 'G#4 A4:.25 B4:.25 A4 G#4 F#4:2',
  },
  {
    id: 'canon-d', pt: 'Cânone em Ré maior', en: 'Canon in D', composer: 'Johann Pachelbel',
    tempo: 132, preset: 'strings', unit: 2,
    score: 'F#5 E5 D5 C#5 B4 A4 B4 C#5 D5 C#5 B4 A4 G4 F#4 G4 E4',
  },
  {
    id: 'brahms-lullaby', pt: 'Canção de Ninar', en: 'Lullaby (Wiegenlied)', composer: 'Johannes Brahms',
    tempo: 108, preset: 'musicbox', unit: 1,
    score: 'E4:.5 E4:.5 G4:1.5 E4:.5 E4 G4:2 E4:.5 G4:.5 C5 B4:1.5 A4:.5 A4 G4 D4:.5 E4:.5 '
      + 'F4 D4 D4:.5 E4:.5 F4:2 D4:.5 F4:.5 B4:.5 A4:.5 G4 B4 C5:2',
  },
  {
    id: 'mountain-king', pt: 'Na Gruta do Rei da Montanha', en: 'In the Hall of the Mountain King', composer: 'Edvard Grieg',
    tempo: 138, preset: 'piano', unit: 0.5,
    score: 'B3 C#4 D4 E4 F#4 D4 F#4:1 F4 C#4 F4:1 E4 C4 E4:1 B3 C#4 D4 E4 F#4 D4 F#4 B4 A4 F#4 D4 F#4 A4:2',
  },
  {
    id: 'morning-mood', pt: 'Amanhecer (Peer Gynt)', en: 'Morning Mood (Peer Gynt)', composer: 'Edvard Grieg',
    tempo: 90, preset: 'flute', unit: 0.5,
    score: 'B4 G#4 F#4 E4 F#4 G#4 B4 G#4 F#4 E4 F#4:.25 G#4:.25 F#4:.25 G#4:.25 '
      + 'B4 G#4 B4 C#5 G#4 C#5 B4 G#4 F#4 E4:1.5',
  },
  {
    id: 'blue-danube', pt: 'Danúbio Azul', en: 'The Blue Danube', composer: 'Johann Strauss II',
    tempo: 184, preset: 'strings', unit: 1,
    score: 'D4 D4 F#4 A4 A4:2 A5 A5 R F#5 F#5 R D4 D4 F#4 A4 A4:2 A5 A5 R G5 G5 R C#4 '
      + 'C#4 E4 B4 B4:2 B5 B5 R G5 G5:2',
  },
].map((tune) => Object.freeze({ ...tune, category: 'classical' })));
