// Закупы из реальных матчей (STRATZ), собранные заранее скриптом scripts/fetch-builds.mjs.
// Файлы лежат в public/builds/<heroId>.json и грузятся по одному, когда открыта карточка героя.

export const BUILD_BRACKETS = [
  { id: 'herald', name: 'Рекрут–Страж' },
  { id: 'crusader', name: 'Рыцарь–Герой' },
  { id: 'legend', name: 'Легенда–Властелин' },
  { id: 'divine', name: 'Божество–Титан' },
];

// Медаль игрока (rank_tier из OpenDota) -> группа рангов STRATZ
export function bracketForRankTier(rankTier) {
  const medal = Math.floor((rankTier ?? 0) / 10);
  if (medal <= 2) return 'herald';
  if (medal <= 4) return 'crusader';
  if (medal <= 6) return 'legend';
  return 'divine';
}

const cache = new Map();

export function getHeroBuilds(heroId) {
  if (!cache.has(heroId)) {
    const url = `${import.meta.env.BASE_URL}builds/${heroId}.json`;
    cache.set(
      heroId,
      fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    );
  }
  return cache.get(heroId);
}

// Какие позиции и ранги есть в данных героя
export function availableGroups(builds) {
  const positions = new Set();
  const brackets = new Set();
  for (const key of Object.keys(builds?.groups ?? {})) {
    const [bracket, pos] = key.split('_');
    brackets.add(bracket);
    positions.add(Number(pos));
  }
  return { positions: [...positions].sort(), brackets: [...brackets] };
}
