// Данные из открытого API OpenDota. Запросы кэшируются, чтобы не дёргать сервер лишний раз.
import { RANK_GROUPS } from './ranks.js';

const BASE = 'https://api.opendota.com/api';
const CDN = 'https://cdn.cloudflare.steamstatic.com';
const cache = new Map();

function get(path, ttlMs = 5 * 60 * 1000) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const promise = fetch(BASE + path).then((res) => {
    if (!res.ok) throw new Error(`OpenDota: ошибка ${res.status}`);
    return res.json();
  });
  promise.catch(() => cache.delete(path));
  cache.set(path, { at: Date.now(), promise });
  return promise;
}

export const ATTRS = [
  { id: 'str', name: 'Сила', color: '#F87171' },
  { id: 'agi', name: 'Ловкость', color: '#34D399' },
  { id: 'int', name: 'Интеллект', color: '#60A5FA' },
  { id: 'all', name: 'Универсал', color: '#C084FC' },
];

export const ROLE_NAMES = {
  Carry: 'Керри',
  Support: 'Саппорт',
  Nuker: 'Урон',
  Disabler: 'Контроль',
  Jungler: 'Лес',
  Durable: 'Живучий',
  Escape: 'Побег',
  Pusher: 'Пуш',
  Initiator: 'Инициатор',
};

// Герои + винрейт и популярность по каждой группе рангов.
export async function getHeroes() {
  const raw = await get('/heroStats', 30 * 60 * 1000);
  const totals = Object.fromEntries(
    RANK_GROUPS.map((g) => [
      g.id,
      raw.reduce((sum, h) => sum + g.brackets.reduce((s, b) => s + (h[`${b}_pick`] || 0), 0), 0),
    ])
  );
  return raw
    .map((h) => {
      const groups = {};
      for (const g of RANK_GROUPS) {
        const picks = g.brackets.reduce((s, b) => s + (h[`${b}_pick`] || 0), 0);
        const wins = g.brackets.reduce((s, b) => s + (h[`${b}_win`] || 0), 0);
        groups[g.id] = {
          picks,
          winrate: picks ? (wins / picks) * 100 : null,
          // герой есть в ~10 из 10 слотов матча, поэтому умножаем на 10
          pickrate: totals[g.id] ? (picks / totals[g.id]) * 1000 : null,
        };
      }
      return {
        id: h.id,
        name: h.localized_name,
        attr: h.primary_attr,
        roles: h.roles || [],
        img: CDN + h.img,
        icon: CDN + h.icon,
        groups,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const getPlayer = (id) => get(`/players/${id}`);
export const getWinLoss = (id) => get(`/players/${id}/wl?limit=20`);
export const getRecentMatches = (id) => get(`/players/${id}/recentMatches`);
export const getPlayerHeroes = (id) => get(`/players/${id}/heroes?limit=100`);

export const isWin = (m) => (m.player_slot < 128) === m.radiant_win;

export async function getPlayerSummary(id) {
  const [player, wl, recent] = await Promise.all([getPlayer(id), getWinLoss(id), getRecentMatches(id)]);
  if (!player?.profile) throw new Error('Игрок не найден');
  return { player, wl, recent };
}

// Предметы: id → название, картинка, цена
let itemsPromise = null;
export function getItems() {
  if (!itemsPromise) {
    itemsPromise = get('/constants/items', 60 * 60 * 1000).then((raw) => {
      const byId = new Map();
      for (const [key, it] of Object.entries(raw)) {
        if (!it || it.id == null) continue;
        byId.set(it.id, {
          key,
          name: it.dname || key,
          img: it.img ? CDN + it.img : null,
          cost: it.cost || 0,
          assembled: Array.isArray(it.components) && it.components.length > 0,
          components: Array.isArray(it.components) ? it.components : null,
        });
      }
      return byId;
    });
    itemsPromise.catch(() => { itemsPromise = null; });
  }
  return itemsPromise;
}

const SKIP_ITEMS = new Set(['tpscroll', 'ward_dispenser', 'dust', 'smoke_of_deceit', 'tome_of_knowledge', 'cheese', 'aegis', 'refresher_shard']);

// Популярные предметы по этапам игры (про-матчи OpenDota)
export async function getItemBuild(heroId) {
  const [pop, items] = await Promise.all([get(`/heroes/${heroId}/itemPopularity`, 60 * 60 * 1000), getItems()]);
  const stage = (obj, { min = 0, assembledOnly = false, limit = 4 }) =>
    Object.entries(obj || {})
      .map(([id, count]) => ({ item: items.get(Number(id)), count }))
      .filter(({ item }) => item && !SKIP_ITEMS.has(item.key) && !item.key.startsWith('recipe_'))
      .filter(({ item }) => item.cost >= min && (!assembledOnly || item.assembled || item.cost >= 2000))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ item }) => item);
  return [
    { id: 'start', name: 'Старт', items: stage(pop.start_game_items, { limit: 4 }) },
    { id: 'early', name: 'Ранняя игра', items: stage(pop.early_game_items, { min: 400, limit: 3 }) },
    { id: 'mid', name: 'Основные', items: stage(pop.mid_game_items, { min: 1000, assembledOnly: true, limit: 4 }) },
    { id: 'late', name: 'Поздняя игра', items: stage(pop.late_game_items, { min: 2000, assembledOnly: true, limit: 4 }) },
  ].filter((s) => s.items.length);
}
