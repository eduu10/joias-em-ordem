// Cancoes tradicionais e populares antigas (anonimas ou de autores mortos antes de 1925).
// `composer: null` quer dizer melodia tradicional, sem autor conhecido.
export const FOLK_TUNES = Object.freeze([
  {
    id: 'twinkle', pt: 'Brilha, Brilha, Estrelinha', en: 'Twinkle, Twinkle, Little Star', composer: null,
    tempo: 160, preset: 'musicbox', unit: 1,
    score: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2',
  },
  {
    id: 'greensleeves', pt: 'Greensleeves', en: 'Greensleeves', composer: null,
    tempo: 88, preset: 'flute', unit: 0.5,
    score: 'A4 C5:1 D5 E5:.75 F5:.25 E5 D5:1 B4 G4:.75 A4:.25 B4 C5:1 A4 A4:.75 G#4:.25 A4 B4:1 G#4 E4:1.5',
  },
  {
    id: 'amazing-grace', pt: 'Amazing Grace (Graça Maravilhosa)', en: 'Amazing Grace', composer: null,
    tempo: 100, preset: 'flute', unit: 1,
    score: 'D4 G4:2 B4:.5 G4:.5 B4:2 A4 G4:2 E4 D4:2 D4 G4:2 B4:.5 G4:.5 B4:2 A4 D5:3',
  },
  {
    id: 'auld-lang-syne', pt: 'Valsa da Despedida (Auld Lang Syne)', en: 'Auld Lang Syne', composer: null,
    tempo: 100, preset: 'strings', unit: 1,
    score: 'C4 F4:1.5 F4:.5 F4 A4 G4:1.5 F4:.5 G4 A4 F4:1.5 F4:.5 A4 C5 D5:3',
  },
  {
    id: 'jingle-bells', pt: 'Jingle Bells (Bate o Sino)', en: 'Jingle Bells', composer: 'James Lord Pierpont',
    tempo: 180, preset: 'musicbox', unit: 1,
    score: 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2',
  },
  {
    id: 'oh-susanna', pt: 'Oh! Susanna', en: 'Oh! Susanna', composer: 'Stephen Foster',
    tempo: 168, preset: 'piano', unit: 1,
    score: 'C4:.5 D4:.5 E4 G4 G4:1.5 A4:.5 G4 E4 C4:1.5 D4:.5 E4 E4 D4 C4 D4:3 '
      + 'C4:.5 D4:.5 E4 G4 G4:1.5 A4:.5 G4 E4 C4:1.5 D4:.5 E4 E4 D4 D4 C4:3',
  },
  {
    id: 'yankee-doodle', pt: 'Yankee Doodle', en: 'Yankee Doodle', composer: null,
    tempo: 190, preset: 'flute', unit: 1,
    score: 'C5 C5 D5 E5 C5 E5 D5 G4 C5 C5 D5 E5 C5:2 B4:2 C5 C5 D5 E5 F5 E5 D5 C5 B4 G4 A4 B4 C5:2 C5:2',
  },
  {
    id: 'frere-jacques', pt: 'Frère Jacques (Meu Irmão João)', en: 'Frère Jacques (Brother John)', composer: null,
    tempo: 150, preset: 'musicbox', unit: 1,
    score: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 '
      + 'G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2',
  },
  {
    id: 'london-bridge', pt: 'A Ponte de Londres', en: 'London Bridge Is Falling Down', composer: null,
    tempo: 160, preset: 'piano', unit: 1,
    score: 'G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2 G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4:2 G4:2 E4 C4:3',
  },
  {
    id: 'row-your-boat', pt: 'Rema, Rema, Rema o Barco', en: 'Row, Row, Row Your Boat', composer: null,
    tempo: 120, preset: 'flute', unit: 0.5,
    score: 'C4:1.5 C4:1.5 C4:1 D4 E4:1.5 E4:1 D4 E4:1 F4 G4:3 C5 C5 C5 G4 G4 G4 E4 E4 E4 C4 C4 C4 '
      + 'G4:1 F4 E4:1 D4 C4:3',
  },
].map((tune) => Object.freeze({ ...tune, category: 'folk' })));
