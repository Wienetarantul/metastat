// Превращает ссылку или число в account_id игрока Dota 2 (32-битный Steam ID).
const STEAM64_BASE = 76561197960265728n;

export function steam64ToAccountId(steam64) {
  return Number(BigInt(steam64) - STEAM64_BASE);
}

export function isVanitySteamLink(input) {
  return /steamcommunity\.com\/id\//i.test(String(input ?? ''));
}

export function parseAccountId(input) {
  const text = String(input ?? '').trim();
  if (!text) return null;

  // Профили OpenDota, Dotabuff, STRATZ: .../players/123456
  const playerLink = text.match(/(?:opendota\.com|dotabuff\.com|stratz\.com)\/players\/(\d+)/i);
  if (playerLink) return Number(playerLink[1]);

  // Steam с числовым ID: steamcommunity.com/profiles/7656119...
  const profileLink = text.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileLink) return steam64ToAccountId(profileLink[1]);

  if (/^\d{17}$/.test(text)) return steam64ToAccountId(text);
  if (/^\d{1,10}$/.test(text)) return Number(text);
  return null;
}
