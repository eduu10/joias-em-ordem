// Cantigas de roda brasileiras: melodias tradicionais, de autor desconhecido.
// Cada uma foi conferida nota a nota (altura e ritmo) com uma partitura publicada; ver o comentario de cada item.
// Tiradas por falta de partitura com ritmo confiavel: Atirei o Pau no Gato, Marcha Soldado, Pirulito, Peixe Vivo.
export const CANTIGA_TUNES = Object.freeze([
  {
    // bethsnotesplus.com/2019/01/ciranda-cirandinha.html (2/4, Fa maior)
    id: 'ciranda', pt: 'Ciranda, Cirandinha', en: 'Ciranda, Cirandinha',
    tempo: 100, preset: 'flute', unit: 0.5,
    score: 'C4 F4 F4 A4 A4 C5 C5 Bb4 A4 G4 Bb4 A4 G4 F4:1 A4 C5 Bb4 A4 G4 F4 E4 C4 Bb4 G4 A4 F4 G4 E4 F4:2',
  },
  {
    // bethsnotesplus.com/2022/06/o-cravo-e-a-rosa.html (3/4, Do maior)
    id: 'cravo-rosa', pt: 'O Cravo e a Rosa', en: 'O Cravo e a Rosa',
    tempo: 132, preset: 'musicbox', unit: 1,
    score: 'G4 G4 E4:.5 C5:.5 B4:.5 A4:.5 G4 F4 A4 A4 F4:.5 C5:.5 B4:.5 A4:.5 G4 G4 G4 '
      + 'C5 C5:.5 C5:.5 D5:.5 C5:.5 B4 A4 A4 G4 B4:.5 G4:.5 F4:.5 D4:.5 C4 C4:2',
  },
  {
    // bethsnotesplus.com/2021/08/cai-cai-balao.html (2/4, Re maior; aqui um tom abaixo)
    id: 'cai-cai-balao', pt: 'Cai, Cai, Balão', en: 'Cai, Cai, Balão',
    tempo: 96, preset: 'piano', unit: 0.5,
    score: 'G4 G4:.75 F4:.25 E4 G4 G4:.75 F4:.25 E4 G4 A4 G4 F4 E4 D4:1 R D4:.25 E4:.25 '
      + 'F4 D4:.25 E4:.25 F4 D4:.25 E4:.25 F4:1 G4 A4 G4 F4 E4 D4 C4:1',
  },
  {
    // bethsnotesplus.com/2023/09/roda-piao.html (2/4, Do maior)
    id: 'roda-piao', pt: 'O Pião Entrou na Roda', en: 'O Pião Entrou na Roda',
    tempo: 92, preset: 'musicbox', unit: 0.5,
    score: 'G4:.25 G4:.25 C5:.75 B4:.25 C5 D5 C5:.25 B4 A4:.25 G4 G4:.25 G4:.25 C5:.75 B4:.25 C5 D5 C5:.25 B4 A4:.25 G4:1 '
      + 'C5:.25 G4 E4:.25 D4 G4 F4:.25 E4 D4:.25 C4:1 C5:.25 G4 E4:.25 D4 G4 F4:.25 E4 D4:.25 C4:1',
  },
  {
    // bethsnotesplus.com/2019/12/borboleta-pequenina.html (2/4, Sol maior), primeira parte
    id: 'borboleta', pt: 'Borboleta Pequenina', en: 'Borboleta Pequenina',
    tempo: 100, preset: 'flute', unit: 0.5,
    score: 'G4:.25 A4:.25 B4 G4 D4 B3 C4 D4 D4 D4 C4 D4 D4 D4 B3:1.5 '
      + 'G4:.25 A4:.25 B4 G4 D4 B3 C4 D4 D4 D4 C4 D4 B4 A4 G4:1.5',
  },
  {
    // bethsnotesplus.com/2022/09/na-bahia-tem.html (2/4, Do maior)
    id: 'na-bahia-tem', pt: 'Na Bahia Tem', en: 'Na Bahia Tem',
    tempo: 100, preset: 'piano', unit: 0.5,
    score: 'C4 C4 E4 E4 G4:2 F4:1 E4:1 D4:2 A4 A4 B4 A4 G4:.25 G4:.5 E4:.25 C4 C4 E4 E4 D4 D4 C4:2',
  },
].map((tune) => Object.freeze({ ...tune, composer: null, category: 'cantigas' })));
