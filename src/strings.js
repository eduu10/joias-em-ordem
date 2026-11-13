const STRINGS = Object.freeze({
  pt: Object.freeze({
    loading: 'Carregando...',
    level: 'Fase',
    moves: 'Jogadas',
    tutorial: 'Toque num pote e depois em outro',
    goal: 'Junte as gemas da mesma cor',
    levelDone: 'Fase concluída!',
    next: 'Próxima fase',
    offerTitle: 'Acabaram as dicas',
    offerBody: 'Quer ver um anúncio e ganhar 3 dicas?',
    offerAccept: 'Ver anúncio',
    offerDecline: 'Agora não',
    hintsEarned: '+3 dicas',
    adUnavailable: 'Anúncio indisponível agora',
    noMoves: 'Sem jogadas: desfaça ou reinicie',
    tryUndo: 'Desfaça uma jogada e tente a dica de novo',
  }),
  en: Object.freeze({
    loading: 'Loading...',
    level: 'Level',
    moves: 'Moves',
    tutorial: 'Tap a jar, then tap another',
    goal: 'Group the gems of the same color',
    levelDone: 'Level complete!',
    next: 'Next level',
    offerTitle: 'Out of hints',
    offerBody: 'Watch an ad to get 3 hints?',
    offerAccept: 'Watch ad',
    offerDecline: 'Not now',
    hintsEarned: '+3 hints',
    adUnavailable: 'No ad available right now',
    noMoves: 'No moves left: undo or restart',
    tryUndo: 'Undo a move and try the hint again',
  }),
});

export const stringsFor = (localeTag) => {
  const lang = String(localeTag || '').slice(0, 2).toLowerCase();
  return STRINGS[lang] ?? STRINGS.en;
};
