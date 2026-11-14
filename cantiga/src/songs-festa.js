// Mais cantigas tradicionais em portugues (Brasil e Portugal), de autor desconhecido. Formato em songs-roda.js.
// Melodia e silabas transcritas nota a nota das partituras do bethsnotesplus.com (URL em `source`).
const BETH = 'https://www.bethsnotesplus.com';

export const FESTA_SONGS = Object.freeze([
  {
    id: 'borboleta',
    title: 'Borboleta Pequenina',
    source: `${BETH}/2019/12/borboleta-pequenina.html`,
    tempo: 100,
    preset: 'flute',
    unit: 0.5,
    lyric: 'Bor-bo-le-ta pe-que-ni-na, sai-a fo-ra do ro-sal. Ve-nha ver quan-ta_a-le-gri-a, que_ho-je_é noi-te de Na-tal.',
    score: 'G4:.25 A4:.25 B4 G4 D4 B3 C4 D4 D4 D4 C4 D4 D4 D4 B3:1.5 '
      + 'G4:.25 A4:.25 B4 G4 D4 B3 C4 D4 D4 D4 C4 D4 B4 A4 G4:1.5',
    stops: [
      { word: 1, wrong: ['amarelinha', 'bonitinha', 'cirandinha'] },
      { word: 5, wrong: ['quintal', 'varal', 'pomar'] },
      { word: 12, wrong: ['São João', 'domingo', 'Carnaval'] },
    ],
  },
  {
    id: 'bahia',
    title: 'Na Bahia Tem',
    source: `${BETH}/2022/09/na-bahia-tem.html`,
    tempo: 100,
    preset: 'piano',
    unit: 0.5,
    lyric: 'Na Ba-hi-a tem, tem, tem, tem, na Ba-hi-a tem, ô bai-a-na, co-co de vin-tém.',
    score: 'C4 C4 E4 E4 G4:2 F4:1 E4:1 D4:2 A4 A4 B4 A4 G4:.25 G4:.5 E4:.25 C4 C4 E4 E4 D4 D4 C4:2',
    stops: [
      { word: 10, wrong: ['menina', 'morena', 'senhora'] },
      { word: 11, wrong: ['milho', 'doce', 'peixe'] },
      { word: 13, wrong: ['também', 'ninguém', 'armazém'] },
    ],
  },
  {
    id: 'atirei',
    title: 'Atirei o Pau no Gato',
    source: `${BETH}/2021/07/atirei-o-pau-ao-gato.html (versao portuguesa da mesma melodia; letra na forma brasileira, mesmas silabas)`,
    tempo: 120,
    preset: 'piano',
    unit: 0.5,
    lyric: 'A-ti-rei o pau no ga-to (to), mas o ga-to (to) não mor-reu (reu) (reu). '
      + 'Do-na Chi-ca (ca) ad-mi-rou-~se (se) do ber-rô, do ber-rô que_o ga-to deu.',
    score: 'G4:1.5 F4 E4 D4 E4 F4 G4:1 G4:1 G4:1 A4 G4 F4:1 F4:1 F4:1 G4 F4 E4:1 E4:1 E4:1 C4 C4 '
      + 'A4:1 A4:1 A4:1 B4 A4 G4:1 G4:1 G4:1 E4 F4 G4:1 E4 F4 G4 F4 E4 D4 C4:2',
    stops: [
      { word: 4, wrong: ['pato', 'rato', 'sapo'] },
      { word: 11, wrong: ['correu', 'choveu', 'bateu'] },
      { word: 15, wrong: ['Rita', 'Clara', 'Nina'] },
      { word: 25, wrong: ['viu', 'fez', 'quis'] },
    ],
  },
  {
    id: 'barata',
    title: 'A Barata Diz que Tem',
    source: `${BETH}/2018/06/a-barata-diz-que-tem.html`,
    tempo: 132,
    preset: 'musicbox',
    unit: 0.5,
    lyric: 'A ba-ra-ta diz que tem se-te sai-as de fi-ló, é men-ti-ra da ba-ra-ta, e-la tem é u-ma só. '
      + 'Ah ra ra, iá ro ró, e-la tem é u-ma só, ah ra ra, iá ro ró, e-la tem é u-ma só.',
    score: 'G4:1.5 F4 E4 D4 E4 F4 G4:1 G4 A4 F4 E4 F4 G4 E4:1 C4 C4 A4 A4 A4 A4 A4 A4 A4 B4 D5 C5 B4 A4 '
      + 'G4:1 G4 G4 C5:1 E4 E4 G4:1 D4 E4 G4 F4 E4 D4 G4:1 G4 G4 C5:1 E4 E4 G4:1 D4 E4 G4 F4 E4 D4 C4:1',
    stops: [
      { word: 6, wrong: ['blusas', 'botas', 'fitas'] },
      { word: 8, wrong: ['cipó', 'paletó', 'dominó'] },
      { word: 12, wrong: ['galinha', 'formiga', 'menina'] },
      { word: 17, wrong: ['pó', 'nó', 'dó'] },
    ],
  },
  {
    id: 'menino',
    title: 'O Menino Está Dormindo',
    source: `${BETH}/2019/11/o-menino-esta-dormindo.html`,
    tempo: 108,
    preset: 'musicbox',
    unit: 0.5,
    lyric: 'O me-ni-no es-tá dor-min-do nas pa-lhi-nhas des-pi-di-nho, o me-ni-no es-tá dor-min-do nas pa-lhi-nhas des-pi-di-nho.',
    score: 'E4 E4 E4 C#4:1 D4 E4:1 F#4:1 G#4:1 G#4:2 F#4:1 D4 D4:1 F#4 E4:1 D4:1 C#4:1 C#4:2 '
      + 'E4 E4 E4 C#4:1 D4 E4:1 F#4:1 G#4:1 G#4:2 F#4:1 D4 D4:1 F#4 E4:1 D4:1 C#4:1 C#4:2',
    stops: [
      { word: 3, wrong: ['cantando', 'sonhando', 'sorrindo'] },
      { word: 5, wrong: ['cobertas', 'florzinhas', 'estrelas'] },
      { word: 6, wrong: ['pequenino', 'bonitinho', 'quietinho'] },
    ],
  },
  {
    id: 'galinhas',
    title: 'Doidas Andam as Galinhas',
    source: `${BETH}/2024/08/doidas-andam-as-galinhas.html`,
    tempo: 112,
    preset: 'piano',
    unit: 0.5,
    lyric: 'Doi-das doi-das doi-das an-dam as ga-li-nhas, pa-ra pôr o o-vo lá no bu-ra-qui-nho. '
      + 'Ras-pam ras-pam ras-pam pra_a-li-sar a ter-ra, pi-cam pi-cam pi-cam pra fa-zer o ni-nho.',
    score: 'A4 F#4 A4 F#4 A4 F#4 A4 F#4 B4:1 A4:1 G4:1 G4:1 G4 E4 G4 E4 G4 E4 G4 B4 A4:1 G4:1 F#4:1 F#4:1 '
      + 'F#4 D4 F#4 D4 F#4 D4 F#4 A4 G4:1 F#4:1 E4:1 E4:1 E4 C#4 E4 C#4 E4 C#4 E4 G4 F#4:1 E4:1 D4:1 D4:1',
    stops: [
      { word: 5, wrong: ['meninas', 'formigas', 'vizinhas'] },
      { word: 9, wrong: ['ninho', 'leite', 'milho'] },
      { word: 12, wrong: ['cantinho', 'caminho', 'barquinho'] },
      { word: 25, wrong: ['pinho', 'vinho', 'linho'] },
    ],
  },
  {
    id: 'zabelinha',
    title: 'Zabelinha Tecedeira',
    source: `${BETH}/2023/06/zabelinha-tecedeira.html`,
    tempo: 132,
    preset: 'strings',
    unit: 0.5,
    lyric: 'Za-be-li-nha te-ce-dei-ra, te-ce num te-ar que-brado. Vem o ven-to da ri-bei-ra, em-ba-ra-ça-~lhe_o fi-ado.',
    score: 'E4 G4 C5:1 C5 B4:1 B4 A4:1 A4 A4:1 C5 B4:1 B4 A4:1 A4 G4:1.5 R E4 G4 '
      + 'F4:1 F4 E4:1 E4 D4:1 D4 D4:1 F4 E4:1 E4 D4:1 D4 C4:1.5',
    stops: [
      { word: 4, wrong: ['lençol', 'balão', 'chapéu'] },
      { word: 8, wrong: ['chuva', 'gato', 'tempo'] },
      { word: 10, wrong: ['ladeira', 'fogueira', 'cachoeira'] },
    ],
  },
  {
    id: 'trevo',
    title: 'Apanhar o Trevo',
    source: `${BETH}/2025/02/apanhar-o-trevo.html`,
    tempo: 96,
    preset: 'flute',
    unit: 0.5,
    lyric: 'A-pa-nhar o tre-vo, ó Ma-ri-a, não en-co-lhas, a-pa-nhar o tre-vo, o tre-vo de qua-tro fo-lhas.',
    score: 'Bb4:.75 Bb4:.25 Bb4 C5 C5 Bb4 G4 Bb4 Bb4 Ab4 F4 C5 C5:1 Bb4:1 '
      + 'Bb4:.75 Bb4:.25 Bb4 C5 C5 Bb4 G4 Bb4 Bb4 Ab4 F4 D4 Eb4:1 Eb4:1',
    stops: [
      { word: 2, wrong: ['cravo', 'milho', 'lírio'] },
      { word: 4, wrong: ['Rosa', 'Joana', 'Teresa'] },
      { word: 14, wrong: ['flores', 'pontas', 'cores'] },
    ],
  },
]);
