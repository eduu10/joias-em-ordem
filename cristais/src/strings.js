const STRINGS = Object.freeze({
  pt: Object.freeze({
    loading: 'Carregando...',
    title: 'Blocos',
    subtitle: 'de Cristal',
    tapToStart: 'Toque para jogar',
    best: 'Recorde',
    score: 'Pontos',
    hint: 'Arraste as peças para o tabuleiro',
    hintLines: 'Complete linhas ou colunas para quebrar os cristais',
    combo: 'Combo',
    multi: Object.freeze(['', '', 'Duplo!', 'Triplo!', 'Quádruplo!', 'Incrível!']),
    perfect: 'Tabuleiro limpo!',
    revived: 'Cristais quebrados!',
    gameOver: 'Sem jogadas!',
    newBest: 'Novo recorde!',
    reviveAd: 'Ver anúncio e continuar',
    reviveInfo: 'Quebra 3 linhas e 3 colunas',
    playAgain: 'Jogar de novo',
    adUnavailable: 'Anúncio indisponível agora',
  }),
  en: Object.freeze({
    loading: 'Loading...',
    title: 'Crystal',
    subtitle: 'Blocks',
    tapToStart: 'Tap to play',
    best: 'Best',
    score: 'Score',
    hint: 'Drag the pieces onto the board',
    hintLines: 'Fill rows or columns to shatter the crystals',
    combo: 'Combo',
    multi: Object.freeze(['', '', 'Double!', 'Triple!', 'Quad!', 'Amazing!']),
    perfect: 'Board cleared!',
    revived: 'Crystals shattered!',
    gameOver: 'No moves left!',
    newBest: 'New best!',
    reviveAd: 'Watch ad to continue',
    reviveInfo: 'Shatters 3 rows and 3 columns',
    playAgain: 'Play again',
    adUnavailable: 'No ad available right now',
  }),
});

export const stringsFor = (localeTag) => {
  const lang = String(localeTag || '').slice(0, 2).toLowerCase();
  return STRINGS[lang] ?? STRINGS.en;
};
