// Unica camada que conversa com o SDK do YouTube Playables (objeto global `ytgame`).
// Fora do YouTube o SDK nao faz nada, entao aqui existe um modo local para desenvolver.
const sdk = typeof ytgame !== 'undefined' ? ytgame : null;
const inPlayables = Boolean(sdk && sdk.IN_PLAYABLES_ENV);
const LOCAL_KEY = 'corrida-save';

const report = (label, error) => {
  console.warn(`[platform] ${label}`, error);
  try { if (inPlayables) sdk.health.logWarning(); } catch { /* sem telemetria disponivel */ }
};

let loaded = false;

// Um anuncio que nunca responde nao pode travar o jogo: depois do limite, segue sem ele.
// O relogio so anda com o jogo ativo. Enquanto o anuncio esta na tela o YouTube pausa o jogo,
// entao assistir a um anuncio longo nunca faz perder a recompensa.
const AD_TIMEOUT_MS = 20000;
let adClock = null;
const withTimeout = (promise, fallback) => {
  let timer = 0;
  let left = AD_TIMEOUT_MS;
  let startedAt = 0;
  let giveUp = () => {};
  const limit = new Promise((resolve) => { giveUp = () => resolve(fallback); });
  const arm = () => {
    clearTimeout(timer);
    startedAt = Date.now();
    timer = setTimeout(giveUp, left);
  };
  const hold = () => {
    clearTimeout(timer);
    left = Math.max(0, left - (Date.now() - startedAt));
    startedAt = Date.now();
  };
  adClock = { arm, hold };
  arm();
  return Promise.race([promise, limit]).finally(() => {
    clearTimeout(timer);
    adClock = null;
  });
};

export const platform = Object.freeze({
  inPlayables,

  firstFrameReady() {
    try { sdk?.game.firstFrameReady(); } catch (e) { report('firstFrameReady', e); }
  },

  gameReady() {
    try { sdk?.game.gameReady(); } catch (e) { report('gameReady', e); }
  },

  // Precisa terminar antes de qualquer saveData, senao o YouTube rejeita o save.
  async loadData() {
    try {
      const raw = inPlayables ? await sdk.game.loadData() : localStorage.getItem(LOCAL_KEY);
      loaded = true;
      return raw ?? '';
    } catch (e) {
      report('loadData', e);
      loaded = !inPlayables;
      return '';
    }
  },

  async saveData(data) {
    if (!loaded) return;
    try {
      if (inPlayables) await sdk.game.saveData(data);
      else localStorage.setItem(LOCAL_KEY, data);
    } catch (e) {
      report('saveData', e);
    }
  },

  async sendScore(value) {
    if (!inPlayables) return;
    try { await sdk.engagement.sendScore({ value }); } catch (e) { report('sendScore', e); }
  },

  // Anuncio entre telas. So chamar em pausas naturais (ex.: entre fases). Nunca trava o jogo se falhar.
  async showInterstitial() {
    if (!inPlayables) return;
    try { await withTimeout(sdk.ads.requestInterstitialAd(), undefined); } catch (e) { report('requestInterstitialAd', e); }
  },

  // Anuncio com recompensa. So chamar depois de o jogador pedir. Devolve true se a recompensa foi ganha.
  // No modo local devolve true para dar para testar o fluxo.
  async showRewarded(rewardId) {
    if (!inPlayables) return true;
    try {
      return Boolean(await withTimeout(sdk.ads.requestRewardedAd(rewardId), false));
    } catch (e) {
      report('requestRewardedAd', e);
      return false;
    }
  },

  async getLanguage() {
    try {
      return inPlayables ? await sdk.system.getLanguage() : navigator.language;
    } catch (e) {
      report('getLanguage', e);
      return 'en';
    }
  },

  isAudioEnabled() {
    try { return inPlayables ? sdk.system.isAudioEnabled() : true; } catch { return false; }
  },

  onAudioEnabledChange(callback) {
    if (inPlayables) sdk.system.onAudioEnabledChange(callback);
  },

  onPause(callback) {
    if (!inPlayables) return;
    sdk.system.onPause(() => {
      adClock?.hold();
      callback();
    });
  },

  onResume(callback) {
    if (!inPlayables) return;
    sdk.system.onResume(() => {
      adClock?.arm();
      callback();
    });
  },
});
