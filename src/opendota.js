// Запросы к открытому API OpenDota: https://docs.opendota.com
const BASE = 'https://api.opendota.com/api';

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  if (process.env.OPENDOTA_API_KEY) {
    url.searchParams.set('api_key', process.env.OPENDOTA_API_KEY);
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`OpenDota ответил ${res.status} на ${path}`);
  return res.json();
}

export const getPlayer = (id) => get(`/players/${id}`);
export const getWinLoss = (id, limit) => get(`/players/${id}/wl`, { limit });
export const getRecentMatches = (id) => get(`/players/${id}/recentMatches`);
export const getPlayerHeroes = (id, limit) => get(`/players/${id}/heroes`, { limit });

let heroNames = null;
export async function getHeroNames() {
  if (!heroNames) {
    const heroes = await get('/constants/heroes');
    heroNames = new Map(Object.values(heroes).map((h) => [h.id, h.localized_name]));
  }
  return heroNames;
}
