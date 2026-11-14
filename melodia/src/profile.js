// Progresso do jogador entre partidas: moedas, nivel, vitorias, lojinha. Funcoes puras.
// As moedas existem so dentro do jogo: nao tem valor real e nao podem ser transferidas.
import { CONFIG, OUTCOME, SHOP_ITEMS, SHOP_KIND } from './config.js';
import { heardTuneIds } from './quiz.js';

export const createProfile = () => ({
  coins: 0,
  xp: 0,
  wins: 0,
  matches: 0,
  best: 0,
  streak: 0,
  recent: [],
  owned: [],
  equipped: { instrument: null, frame: null },
  adReady: false,
});

export const itemById = (id) => SHOP_ITEMS.find((item) => item.id === id) ?? null;

const xpNeeded = (level) => CONFIG.xpLevelBase + CONFIG.xpLevelStep * (level - 1);

// Nivel atual, quanto XP ja tem dentro dele e quanto falta para o proximo.
export const levelInfo = (xp) => {
  let level = 1;
  let into = Math.max(0, Math.floor(Number(xp) || 0));
  while (level < CONFIG.maxLevel && into >= xpNeeded(level)) {
    into -= xpNeeded(level);
    level += 1;
  }
  const need = xpNeeded(level);
  return { level, into: Math.min(into, need), need };
};

export const outcomeOf = (playerScore, rivalScore) => {
  if (playerScore > rivalScore) return OUTCOME.WIN;
  return playerScore === rivalScore ? OUTCOME.TIE : OUTCOME.LOSE;
};

const BASE_COINS = Object.freeze({
  [OUTCOME.WIN]: CONFIG.coinsWin, [OUTCOME.TIE]: CONFIG.coinsTie, [OUTCOME.LOSE]: CONFIG.coinsLose,
});
const BASE_XP = Object.freeze({
  [OUTCOME.WIN]: CONFIG.xpWin, [OUTCOME.TIE]: CONFIG.xpTie, [OUTCOME.LOSE]: CONFIG.xpLose,
});

// `streak` e a sequencia de vitorias ja contando esta partida.
export const rewardFor = (outcome, playerScore, streak, double) => {
  const base = BASE_COINS[outcome];
  const streakBonus = outcome === OUTCOME.WIN
    ? Math.min(CONFIG.streakBonusCap, CONFIG.streakBonusPerWin * Math.max(0, streak - 1))
    : 0;
  const factor = double ? CONFIG.doubleCoinsFactor : 1;
  return {
    base,
    streakBonus,
    coins: (base + streakBonus) * factor,
    xp: BASE_XP[outcome] + Math.round(playerScore * CONFIG.xpPerPoint),
  };
};

const rememberTunes = (recent, heard) =>
  [...recent.filter((id) => !heard.includes(id)), ...heard].slice(-CONFIG.recentLimit);

// Fecha uma partida terminada: paga moedas e XP e atualiza os recordes.
export const applyMatch = (profile, match) => {
  const outcome = outcomeOf(match.playerScore, match.rivalScore);
  const streak = outcome === OUTCOME.WIN ? profile.streak + 1 : 0;
  const reward = rewardFor(outcome, match.playerScore, streak, match.double);
  const next = {
    ...profile,
    coins: profile.coins + reward.coins,
    xp: profile.xp + reward.xp,
    wins: profile.wins + (outcome === OUTCOME.WIN ? 1 : 0),
    matches: profile.matches + 1,
    best: Math.max(profile.best, match.playerScore),
    streak,
    recent: rememberTunes(profile.recent, heardTuneIds(match)),
    adReady: true,
  };
  return {
    profile: next,
    summary: {
      ...reward,
      outcome,
      double: Boolean(match.double),
      streak,
      playerScore: match.playerScore,
      rivalScore: match.rivalScore,
      newBest: match.playerScore > profile.best,
      levelBefore: levelInfo(profile.xp),
      levelAfter: levelInfo(next.xp),
    },
  };
};

// Bonus do anuncio opcional da tela inicial: no maximo um por partida jogada.
export const claimHomeAd = (profile) =>
  (profile.adReady ? { ...profile, coins: profile.coins + CONFIG.homeAdCoins, adReady: false } : profile);

export const isOwned = (profile, id) => profile.owned.includes(id);
export const canBuy = (profile, id) => {
  const item = itemById(id);
  return Boolean(item) && !isOwned(profile, id) && profile.coins >= item.price;
};

export const buyItem = (profile, id) => {
  if (!canBuy(profile, id)) return { profile, bought: false };
  const item = itemById(id);
  return {
    bought: true,
    profile: {
      ...profile,
      coins: profile.coins - item.price,
      owned: [...profile.owned, id],
      equipped: { ...profile.equipped, [item.kind]: id },
    },
  };
};

// Tocar num item que ja e seu liga ou desliga o uso dele.
export const toggleEquip = (profile, id) => {
  const item = itemById(id);
  if (!item || !isOwned(profile, id)) return profile;
  const current = profile.equipped[item.kind];
  return { ...profile, equipped: { ...profile.equipped, [item.kind]: current === id ? null : id } };
};

// Timbre escolhido na lojinha, ou null para usar o timbre proprio de cada melodia.
export const instrumentOverride = (profile) => itemById(profile.equipped[SHOP_KIND.INSTRUMENT])?.preset ?? null;
