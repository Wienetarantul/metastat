// Превращает ссылку или число в account_id игрока Dota 2.
const STEAM64_BASE = 76561197960265728n;

export function parseAccountId(input) {
  const text = String(input ?? '').trim();
  if (!text) return null;
  const playerLink = text.match(/(?:opendota\.com|dotabuff\.com|stratz\.com)\/players\/(\d+)/i);
  if (playerLink) return Number(playerLink[1]);
  const profileLink = text.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileLink) return Number(BigInt(profileLink[1]) - STEAM64_BASE);
  if (/^\d{17}$/.test(text)) return Number(BigInt(text) - STEAM64_BASE);
  if (/^\d{1,10}$/.test(text)) return Number(text);
  return null;
}
