const STRINGS = Object.freeze({
  pt: Object.freeze({
    loading: 'Carregando...',
    title: 'Fusão',
    subtitle: 'Cósmica',
    tapToStart: 'Toque para jogar',
    next: 'Próximo',
    best: 'Recorde',
    hintDrop: 'Arraste para mirar e solte para lançar',
    hintMerge: 'Junte dois corpos iguais para fundir',
    danger: 'Cuidado com a linha!',
    gameOver: 'A cápsula transbordou!',
    yourScore: 'Pontos',
    newBest: 'Novo recorde!',
    continueAd: 'Ver anúncio e continuar',
    playAgain: 'Jogar de novo',
    adUnavailable: 'Anúncio indisponível agora',
    continued: 'Espaço liberado!',
    bigBang: 'Big Bang!',
  }),
  en: Object.freeze({
    loading: 'Loading...',
    title: 'Cosmic',
    subtitle: 'Merge',
    tapToStart: 'Tap to play',
    next: 'Next',
    best: 'Best',
    hintDrop: 'Drag to aim, release to drop',
    hintMerge: 'Match two equal bodies to merge',
    danger: 'Watch the line!',
    gameOver: 'The capsule overflowed!',
    yourScore: 'Score',
    newBest: 'New best!',
    continueAd: 'Watch ad to continue',
    playAgain: 'Play again',
    adUnavailable: 'No ad available right now',
    continued: 'Space cleared!',
    bigBang: 'Big Bang!',
  }),
});

export const stringsFor = (localeTag) => {
  const lang = String(localeTag || '').slice(0, 2).toLowerCase();
  return STRINGS[lang] ?? STRINGS.en;
};
