// Cantigas de roda brasileiras tradicionais (autor desconhecido). So a primeira estrofe/refrao tradicional.
// Melodia e silabas transcritas nota a nota das partituras do bethsnotesplus.com (URL em `source`).
// `lyric`: palavras separadas por espaco, silabas por '-', '_' vira espaco dentro da silaba (elisao).
// `score`: uma nota por silaba, na mesma ordem; "R" e pausa (sem silaba). Duracao em tempos depois de ':'.
// `stops`: indice da palavra escondida e tres palavras erradas para as opcoes.
const BETH = 'https://www.bethsnotesplus.com';

export const RODA_SONGS = Object.freeze([
  {
    id: 'ciranda',
    title: 'Ciranda, Cirandinha',
    source: `${BETH}/2019/01/ciranda-cirandinha.html`,
    tempo: 100,
    preset: 'flute',
    unit: 0.5,
    lyric: 'Ci-ran-da, ci-ran-di-nha, va-mos to-dos ci-ran-dar, va-mos dar a mei-a vol-ta, vol-ta_e mei-a va-mos dar.',
    score: 'C4 F4 F4 A4 A4 C5 C5 Bb4 A4 G4 Bb4 A4 G4 F4:1 A4 C5 Bb4 A4 G4 F4 E4 C4 Bb4 G4 A4 F4 G4 E4 F4:2',
    stops: [
      { word: 4, wrong: ['passear', 'festejar', 'navegar'] },
      { word: 9, wrong: ['roda', 'festa', 'ponta'] },
      { word: 13, wrong: ['mão', 'pau', 'chão'] },
    ],
  },
  {
    id: 'balao',
    title: 'Cai, Cai, Balão',
    source: `${BETH}/2021/08/cai-cai-balao.html`,
    tempo: 96,
    preset: 'piano',
    unit: 0.5,
    lyric: 'Cai, cai, ba-lão, cai, cai, ba-lão, a-qui na mi-nha mão. Não cai não, não cai não, não cai não, cai na ru-a do sa-bão.',
    score: 'G4 G4:.75 F4:.25 E4 G4 G4:.75 F4:.25 E4 G4 A4 G4 F4 E4 D4:1 R D4:.25 E4:.25 '
      + 'F4 D4:.25 E4:.25 F4 D4:.25 E4:.25 F4:1 G4 A4 G4 F4 E4 D4 C4:1',
    stops: [
      { word: 5, wrong: ['limão', 'pião', 'feijão'] },
      { word: 9, wrong: ['pão', 'chão', 'pé'] },
      { word: 23, wrong: ['feijão', 'limão', 'pião'] },
    ],
  },
  {
    id: 'cravo',
    title: 'O Cravo e a Rosa',
    source: `${BETH}/2022/06/o-cravo-e-a-rosa.html`,
    tempo: 132,
    preset: 'musicbox',
    unit: 1,
    lyric: 'O cra-vo bri-gou com_a ro-sa de-bai-xo de_u-ma sa-ca-da, o cra-vo sa-iu fe-ri-do e_a ro-sa des-pe-da-ça-da.',
    score: 'G4 G4 E4:.5 C5:.5 B4:.5 A4:.5 G4 F4 A4 A4 F4:.5 C5:.5 B4:.5 A4:.5 G4 G4 G4 '
      + 'C5 C5:.5 C5:.5 D5:.5 C5:.5 B4 A4 A4 G4 B4:.5 G4:.5 F4:.5 D4:.5 C4 C4:2',
    stops: [
      { word: 4, wrong: ['lua', 'casa', 'roda'] },
      { word: 7, wrong: ['calçada', 'estrada', 'cascata'] },
      { word: 11, wrong: ['perdido', 'cansado', 'molhado'] },
      { word: 14, wrong: ['amarrotada', 'enfeitada', 'perfumada'] },
    ],
  },
  {
    id: 'pirulito',
    title: 'Pirulito que Bate Bate',
    source: `${BETH}/2025/01/pirulito-que-bate-bate.html`,
    tempo: 100,
    preset: 'musicbox',
    unit: 0.5,
    lyric: 'Pi-ru-li-to que ba-te ba-te, pi-ru-li-to que já ba-teu, quem gos-ta de mim é e-la, quem gos-ta de-la sou eu.',
    score: 'E4:.25 F4:.25 G4 G4:.25 G4:.25 F4 E4 A4 A4:1 D4:.25 E4:.25 F4 F4:.25 F4:.25 E4 D4 G4:1 R E4 '
      + 'G4 G4:.25 G4:.25 F4 E4 A4 C5 B4 A4 G4 F4 E4 D4 C4:1',
    stops: [
      { word: 7, wrong: ['correu', 'morreu', 'choveu'] },
      { word: 13, wrong: ['ele', 'você', 'bela'] },
      { word: 18, wrong: ['seu', 'meu', 'céu'] },
    ],
  },
  {
    id: 'canoa',
    title: 'A Canoa Virou',
    source: `${BETH}/2025/12/a-canoa-virou.html`,
    tempo: 108,
    preset: 'flute',
    unit: 0.5,
    lyric: 'A ca-no-a vi-rou por dei-xar e-la vi-rar, foi por cau-sa da Ma-ri-a_que não sou-be re-mar. '
      + 'Se eu fo-sse_um pei-xi-nho_e sou-be-sse na-dar, eu ti-ra-va a Ma-ri-a_do fun-do do mar.',
    score: 'E4 E4 E4:1 E4 D4 C#4:1 E4 E4 A4 A4 A4 G#4 F#4:1 F#4 F#4 B4:1 B4 A4 '
      + 'G#4 G#4 G#4 F#4 E4:1 E4 D4 C#4:1 E4 E4 E4:1 E4 D4 C#4:1 E4 E4 '
      + 'A4:1 A4 G#4 F#4:1 F#4 F#4 B4:1 B4 A4 G#4:1 G#4 F#4 E4:1 F#4 G#4 A4:1',
    stops: [
      { word: 2, wrong: ['parou', 'voou', 'chegou'] },
      { word: 14, wrong: ['nadar', 'cantar', 'voltar'] },
      { word: 20, wrong: ['voar', 'pular', 'correr'] },
      { word: 27, wrong: ['sol', 'céu', 'chão'] },
    ],
  },
  {
    id: 'sambalele',
    title: 'Samba Lelê',
    source: `${BETH}/2015/11/sambalele.html`,
    tempo: 126,
    preset: 'piano',
    unit: 0.5,
    lyric: 'Sam-ba Le-lê_es-tá do-en-te, Está com ca-be-ça que-bra-da, Sam-ba Le-lê pre-ci-sa-va de_u-mas de-zoi-to lam-ba-das.',
    score: 'F4 F4:1 A4 C5 A4:1 F4 G4:1.5 Bb4:1.5 R:1 E4 E4:1 G4 Bb4 G4:1 E4 F4:1.5 A4:1.5 R:1 '
      + 'F4 F4:1 A4 C5 A4:1 F4 G4:1.5 Bb4:1.5 R:1 E4 E4:1 G4 Bb4 G4:1 E4 F4:1.5 A4:1.5 R:1',
    stops: [
      { word: 2, wrong: ['contente', 'cansado', 'sozinho'] },
      { word: 5, wrong: ['panela', 'janela', 'boneca'] },
      { word: 6, wrong: ['molhada', 'pintada', 'enfeitada'] },
    ],
  },
  {
    id: 'piao',
    title: 'O Pião Entrou na Roda',
    source: `${BETH}/2023/10/o-piao-entrou-na-roda.html`,
    tempo: 92,
    preset: 'musicbox',
    unit: 0.5,
    lyric: 'O pi-ão en-trou na ro-da_ó pi-ão, o pi-ão en-trou na ro-da_ó pi-ão. '
      + 'Ro-da pi-ão, bam-bei-a pi-ão, ro-da pi-ão, bam-bei-a pi-ão.',
    score: 'G4:.25 G4:.25 C5 C5 B4 D5 C5:.25 B4 A4:.25 G4 G4:.25 G4:.25 C5 C5 B4 D5 C5:.25 B4 A4:.25 G4:1 '
      + 'C5:.25 G4 E4:.25 D4 G4 F4:.25 E4 D4:.25 C4:1 C5:.25 G4 E4:.25 D4 G4 F4:.25 E4 D4:.25 C4:1',
    stops: [
      { word: 2, wrong: ['saiu', 'girou', 'pulou'] },
      { word: 5, wrong: ['balão', 'limão', 'feijão'] },
      { word: 14, wrong: ['balança', 'requebra', 'rodeia'] },
    ],
  },
]);
