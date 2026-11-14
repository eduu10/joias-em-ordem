// Cantigas de roda brasileiras: melodias tradicionais, de autor desconhecido.
export const CANTIGA_TUNES = Object.freeze([
  {
    id: 'ciranda', pt: 'Ciranda, Cirandinha', en: 'Ciranda, Cirandinha',
    tempo: 100, preset: 'flute', unit: 0.5,
    score: 'C4 F4 F4 A4 A4 C5 C5 Bb4 A4 G4 Bb4 A4 G4 F4:1 A4 C5 Bb4 A4 G4 F4 E4 C4 Bb4 G4 A4 F4 G4 E4 F4:2',
  },
  {
    id: 'atirei-o-pau', pt: 'Atirei o Pau no Gato', en: 'Atirei o Pau no Gato',
    tempo: 104, preset: 'piano', unit: 0.5,
    score: 'G4 F4 E4 D4 E4 F4 G4 G4 G4:1 A4 G4 F4 F4 F4:1 G4 F4 E4 E4 E4:1 C5 C5 A4 A4 A4:1 B4 A4 G4 G4 G4:1',
  },
  {
    id: 'cravo-rosa', pt: 'O Cravo e a Rosa', en: 'O Cravo e a Rosa',
    tempo: 150, preset: 'musicbox', unit: 1,
    score: 'G4 G4 E4 C5 B4:2 A4 G4 F4 A4 A4 F4 C5 B4:2 A4 G4 G4 G4 C5 C5 C5 D5:2 C5 B4 A4:2',
  },
  {
    id: 'marcha-soldado', pt: 'Marcha Soldado', en: 'Marcha Soldado',
    tempo: 112, preset: 'flute', unit: 0.5,
    score: 'G4:1 G4 E4 C4:1 C4 E4 G4 G4 G4 E4 D4:1.5 E4 F4 F4 F4 D4 G4:1 G4 A4 G4 F4 E4 D4 C4:2',
  },
  {
    id: 'pirulito', pt: 'Pirulito que Bate Bate', en: 'Pirulito que Bate Bate',
    tempo: 152, preset: 'musicbox', unit: 1,
    score: 'E4:.5 F4:.5 G4 G4 G4 F4:2 E4 A4 A4 D4:.5 E4:.5 F4 F4 F4 E4:2 D4 G4:3',
  },
  {
    id: 'cai-cai-balao', pt: 'Cai, Cai, Balão', en: 'Cai, Cai, Balão',
    tempo: 132, preset: 'piano', unit: 1,
    score: 'G4 G4 F4 E4 G4 G4 F4 E4 G4:.5 A4:.5 G4:.5 F4:.5 E4 D4 D4 E4 F4:2',
  },
  {
    id: 'peixe-vivo', pt: 'Peixe Vivo', en: 'Peixe Vivo',
    tempo: 100, preset: 'flute', unit: 0.5,
    score: 'A4 C5 C5 Bb4 Bb4 D5 D5 C5 A4 C5 C5 Bb4 G4 Bb4 Bb4 A4 A4 C5 C5 Bb4 Bb4 D5 D5 C5 A4 C5 C5 Bb4 G4 Bb4 Bb4 A4',
  },
].map((tune) => Object.freeze({ ...tune, composer: null, category: 'cantigas' })));
