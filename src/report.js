// Собирает текстовый отчёт по игроку из данных OpenDota.
import { getPlayer, getWinLoss, getRecentMatches, getPlayerHeroes, getHeroNames } from './opendota.js';

const RANKS = ['', 'Рекрут', 'Страж', 'Рыцарь', 'Герой', 'Легенда', 'Властелин', 'Божество', 'Титан'];

export function rankName(rankTier) {
  if (!rankTier) return 'ранг скрыт';
  const medal = RANKS[Math.floor(rankTier / 10)] ?? 'неизвестный ранг';
  const stars = rankTier % 10;
  return stars ? `${medal} ${stars}` : medal;
}

export function escapeHtml(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function games(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} игра`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} игры`;
  return `${n} игр`;
}

const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);
const avg = (list, key) => (list.length ? list.reduce((s, m) => s + (m[key] ?? 0), 0) / list.length : 0);
const isWin = (m) => (m.player_slot < 128) === m.radiant_win;

export function formatReport({ player, wl, recent, heroes, heroNames }) {
  const name = escapeHtml(player.profile.personaname || 'Без имени');
  const lines = [`<b>${name}</b> · ${rankName(player.rank_tier)}`];

  if (!recent.length) {
    lines.push('', 'Матчей не видно. Скорее всего, в настройках Dota 2 выключен общий доступ к данным матчей.');
    return lines.join('\n');
  }

  const total = wl.win + wl.lose;
  lines.push('', `Последние ${games(total)}: ${wl.win} побед, ${wl.lose} поражений (${pct(wl.win, total)}%)`);

  const deaths = avg(recent, 'deaths');
  const kda = (avg(recent, 'kills') + avg(recent, 'assists')) / Math.max(deaths, 1);
  lines.push(
    `Средние за ${games(recent.length)}: KDA ${kda.toFixed(1)} · золото/мин ${Math.round(avg(recent, 'gold_per_min'))}` +
      ` · опыт/мин ${Math.round(avg(recent, 'xp_per_min'))} · добивания ${Math.round(avg(recent, 'last_hits'))}`
  );

  const top = heroes.filter((h) => h.games > 0).slice(0, 5);
  if (top.length) {
    lines.push('', '<b>Чаще всего играет (последние 100 игр):</b>');
    for (const h of top) {
      lines.push(`• ${heroNames.get(h.hero_id) ?? `Герой #${h.hero_id}`} — ${games(h.games)}, ${pct(h.win, h.games)}% побед`);
    }
  }

  lines.push('', '<b>Последние матчи:</b>');
  for (const m of recent.slice(0, 5)) {
    const hero = heroNames.get(m.hero_id) ?? `Герой #${m.hero_id}`;
    const result = isWin(m) ? 'Победа' : 'Поражение';
    lines.push(`${result} · ${hero} · ${m.kills}/${m.deaths}/${m.assists} · ${Math.round(m.duration / 60)} мин`);
  }
  return lines.join('\n');
}

export async function buildPlayerReport(accountId) {
  const player = await getPlayer(accountId);
  if (!player?.profile) {
    return 'Игрок не найден. Проверьте ID или ссылку на профиль.';
  }
  const [wl, recent, heroes, heroNames] = await Promise.all([
    getWinLoss(accountId, 20),
    getRecentMatches(accountId),
    getPlayerHeroes(accountId, 100),
    getHeroNames(),
  ]);
  return formatReport({ player, wl, recent, heroes, heroNames });
}
