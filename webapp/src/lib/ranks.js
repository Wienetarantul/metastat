// Медали Dota 2 и группы рангов для меты.
const MEDALS = ['', 'Рекрут', 'Страж', 'Рыцарь', 'Герой', 'Легенда', 'Властелин', 'Божество', 'Титан'];

export const RANK_GROUPS = [
  { id: 'low', name: 'Рекрут–Рыцарь', short: 'Рекрут–Рыцарь', brackets: [1, 2, 3] },
  { id: 'mid', name: 'Герой–Легенда', short: 'Герой–Легенда', brackets: [4, 5] },
  { id: 'high', name: 'Властелин–Божество', short: 'Властелин–Бож.', brackets: [6, 7] },
  { id: 'top', name: 'Титан', short: 'Титан', brackets: [8] },
];

export function medalName(rankTier) {
  if (!rankTier) return 'Без ранга';
  const medal = MEDALS[Math.floor(rankTier / 10)] ?? 'Ранг';
  const stars = rankTier % 10;
  return stars ? `${medal} ${stars}` : medal;
}

export function medalIcon(rankTier) {
  const medal = Math.floor((rankTier || 0) / 10);
  return `https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_${medal}.png`;
}

export function medalStars(rankTier) {
  const stars = (rankTier || 0) % 10;
  return stars ? `https://www.opendota.com/assets/images/dota2/rank_icons/rank_star_${stars}.png` : null;
}

export function groupForRankTier(rankTier) {
  const medal = Math.floor((rankTier || 0) / 10);
  return RANK_GROUPS.find((g) => g.brackets.includes(medal))?.id ?? 'mid';
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

// Картинки медалей для группы рангов (первая и последняя медаль группы)
export function groupIcons(groupId) {
  const g = RANK_GROUPS.find((x) => x.id === groupId);
  if (!g) return [];
  const first = g.brackets[0];
  const last = g.brackets[g.brackets.length - 1];
  const icon = (m) => `https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_${m}.png`;
  return first === last ? [icon(first)] : [icon(first), icon(last)];
}
