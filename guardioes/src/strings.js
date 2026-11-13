const STRINGS = Object.freeze({
  pt: Object.freeze({
    loading: 'Carregando...',
    title: 'Guardiões',
    subtitle: 'da Fusão',
    tapToStart: 'Toque para jogar',
    wave: 'Onda',
    boss: 'Chefe!',
    summon: 'Invocar',
    nextWave: 'Próxima onda em',
    hintBuy: 'Toque em Invocar para chamar um guardião',
    hintMerge: 'Arraste um guardião sobre outro igual para fundir',
    gameOver: 'O castelo caiu!',
    reached: 'Você chegou à onda',
    best: 'Recorde: onda',
    reviveAd: 'Ver anúncio e continuar',
    playAgain: 'Jogar de novo',
    adUnavailable: 'Anúncio indisponível agora',
    waveBonus: 'Bônus',
  }),
  en: Object.freeze({
    loading: 'Loading...',
    title: 'Fusion',
    subtitle: 'Guardians',
    tapToStart: 'Tap to play',
    wave: 'Wave',
    boss: 'Boss!',
    summon: 'Summon',
    nextWave: 'Next wave in',
    hintBuy: 'Tap Summon to call a guardian',
    hintMerge: 'Drag a guardian onto a matching one to merge',
    gameOver: 'The castle fell!',
    reached: 'You reached wave',
    best: 'Best: wave',
    reviveAd: 'Watch ad to continue',
    playAgain: 'Play again',
    adUnavailable: 'No ad available right now',
    waveBonus: 'Bonus',
  }),
});

export const stringsFor = (localeTag) => {
  const lang = String(localeTag || '').slice(0, 2).toLowerCase();
  return STRINGS[lang] ?? STRINGS.en;
};
