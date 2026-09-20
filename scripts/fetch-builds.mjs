// Сборщик закупов: STRATZ -> webapp/public/builds/<heroId>.json
// Данные по каждому герою: для 4 групп рангов и 5 позиций — стартовый закуп,
// ботинки и основные предметы с таймингами и процентом побед. Всё из реальных матчей.
// Запуск: node scripts/fetch-builds.mjs [heroId ...]
import { mkdir, writeFile } from 'node:fs/promises';

process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;
if (!TOKEN) { console.error('В .env нет STRATZ_TOKEN'); process.exit(1); }

const OUT_DIR = new URL('../webapp/public/builds/', import.meta.url);

// Ключи наших групп рангов -> группы STRATZ
export const BRACKETS = [
  ['herald', 'HERALD_GUARDIAN'],
  ['crusader', 'CRUSADER_ARCHON'],
  ['legend', 'LEGEND_ANCIENT'],
  ['divine', 'DIVINE_IMMORTAL'],
];
const POSITIONS = [1, 2, 3, 4, 5];

// Минимум матчей, чтобы показывать связку «ранг + позиция»
const MIN_MATCHES = 150;
// Предмет показываем, если он встречается хотя бы в 8% матчей этой связки
const MIN_SHARE = 0.08;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, attempt = 1) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) throw new Error(`STRATZ ${res.status}`);
    const wait = 5000 * attempt;
    console.log(`  ждём ${wait / 1000}с (ответ ${res.status})`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 300));
  return json.data;
}

// Один запрос на героя: все ранги x все позиции через алиасы
function heroQuery(heroId) {
  const parts = [];
  for (const [key, bracket] of BRACKETS) {
    for (const p of POSITIONS) {
      const args = `heroId: ${heroId}, bracketBasicIds: [${bracket}], positionIds: [POSITION_${p}]`;
      parts.push(`f_${key}_${p}: itemFullPurchase(${args}) { itemId instance time matchCount winCount }`);
      parts.push(`s_${key}_${p}: itemStartingPurchase(${args}) { itemId matchCount winCount }`);
      parts.push(`b_${key}_${p}: itemBootPurchase(${args}) { itemId timeAverage matchCount winCount }`);
    }
  }
  return `{ heroStats { ${parts.join('\n')} } }`;
}

// Сворачиваем строки «предмет + минута» в один предмет: сколько матчей, процент побед,
// средняя минута покупки и на каком месте в закупе он обычно идёт.
function foldFull(rows) {
  const byItem = new Map();
  for (const r of rows) {
    const m = Number(r.matchCount);
    const cur = byItem.get(r.itemId) || { itemId: r.itemId, matches: 0, wins: 0, timeSum: 0, slotSum: 0 };
    cur.matches += m;
    cur.wins += Number(r.winCount);
    cur.timeSum += Number(r.time) * m;
    cur.slotSum += Number(r.instance) * m;
    byItem.set(r.itemId, cur);
  }
  return [...byItem.values()].map((x) => ({
    id: x.itemId,
    n: x.matches,
    wr: +(x.wins / x.matches * 100).toFixed(1),
    min: +(x.timeSum / x.matches).toFixed(1),
    slot: +(x.slotSum / x.matches).toFixed(1),
  }));
}

function foldSimple(rows, timeKey) {
  const byItem = new Map();
  for (const r of rows) {
    const m = Number(r.matchCount);
    const cur = byItem.get(r.itemId) || { itemId: r.itemId, matches: 0, wins: 0, timeSum: 0 };
    cur.matches += m;
    cur.wins += Number(r.winCount);
    if (timeKey) cur.timeSum += Number(r[timeKey] || 0) * m;
    byItem.set(r.itemId, cur);
  }
  return [...byItem.values()].map((x) => ({
    id: x.itemId,
    n: x.matches,
    wr: +(x.wins / x.matches * 100).toFixed(1),
    ...(timeKey ? { min: +(x.timeSum / x.matches / 60).toFixed(1) } : {}),
  }));
}

// Сколько матчей в связке «ранг + позиция»: берём самый частый стартовый предмет как базу
function sampleSize(foldedStart) {
  return foldedStart.reduce((max, r) => Math.max(max, r.n), 0);
}

function pick(list, total, limit) {
  return list
    .filter((x) => x.n >= total * MIN_SHARE)
    .sort((a, b) => b.n - a.n)
    .slice(0, limit);
}

async function buildHero(hero) {
  const data = (await gql(heroQuery(hero.id))).heroStats;
  const out = { heroId: hero.id, name: hero.localized_name, updated: new Date().toISOString().slice(0, 10), groups: {} };
  let kept = 0;

  for (const [key] of BRACKETS) {
    for (const p of POSITIONS) {
      const startRows = foldSimple(data[`s_${key}_${p}`] || []);
      const total = sampleSize(startRows);
      if (total < MIN_MATCHES) continue;
      const full = foldFull(data[`f_${key}_${p}`] || []);
      const boots = foldSimple(data[`b_${key}_${p}`] || [], 'timeAverage');
      out.groups[`${key}_${p}`] = {
        matches: total,
        start: pick(startRows, total, 8),
        boots: pick(boots, total, 4),
        core: pick(full, total, 12).sort((a, b) => a.min - b.min),
      };
      kept++;
    }
  }
  return kept ? out : null;
}

const only = process.argv.slice(2).map(Number).filter(Boolean);

const heroes = await (await fetch('https://api.opendota.com/api/heroes')).json();
const list = only.length ? heroes.filter((h) => only.includes(h.id)) : heroes;
await mkdir(OUT_DIR, { recursive: true });

const index = [];
let done = 0;
for (const hero of list) {
  try {
    const built = await buildHero(hero);
    if (!built) { console.log(`— ${hero.localized_name}: мало данных`); continue; }
    await writeFile(new URL(`${hero.id}.json`, OUT_DIR), JSON.stringify(built));
    index.push({ id: hero.id, groups: Object.keys(built.groups) });
    done++;
    console.log(`✓ ${hero.localized_name}: связок ${Object.keys(built.groups).length}`);
  } catch (err) {
    console.log(`× ${hero.localized_name}: ${err.message}`);
  }
  await sleep(1200);
}

if (!only.length) {
  await writeFile(new URL('index.json', OUT_DIR), JSON.stringify({ updated: new Date().toISOString().slice(0, 10), heroes: index }));
  // Отмечаем, по какому патчу собраны закупы — по нему решаем, пора ли пересобирать
  const { currentPatch, savePatch } = await import('./check-patch.mjs');
  const patch = await currentPatch();
  await savePatch(patch);
  console.log(`Отмечен патч ${patch.name}`);
}
console.log(`\nГотово: ${done} из ${list.length} героев -> webapp/public/builds/`);
