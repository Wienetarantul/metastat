// Что реально отдаёт itemFullPurchase: какие instance и предметы, и сколько данных.
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

async function gql(query) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) { console.log('ERRORS', JSON.stringify(json.errors).slice(0, 800)); process.exit(1); }
  return json.data;
}

const items = await (await fetch('https://api.opendota.com/api/constants/items')).json();
const nameById = {};
for (const [key, v] of Object.entries(items)) nameById[v.id] = v.dname || key;

for (const maxTime of [null, 90]) {
  const arg = maxTime ? `, maxTime: ${maxTime}` : '';
  const d = await gql(`{ heroStats { itemFullPurchase(heroId: 60, bracketBasicIds: [LEGEND_ANCIENT], positionIds: [POSITION_3]${arg}) { itemId instance time matchCount winCount } } }`);
  const rows = d.heroStats.itemFullPurchase;
  const byInstance = new Map();
  for (const r of rows) {
    const key = `${r.instance}|${r.itemId}`;
    const cur = byInstance.get(key) || { instance: r.instance, itemId: r.itemId, matches: 0, wins: 0 };
    cur.matches += Number(r.matchCount); cur.wins += Number(r.winCount);
    byInstance.set(key, cur);
  }
  const list = [...byInstance.values()].sort((a, b) => a.instance - b.instance || b.matches - a.matches);
  console.log(`\n--- maxTime=${maxTime ?? 'по умолчанию'}: строк ${rows.length}, уникальных пар ${list.length}`);
  for (const x of list.slice(0, 20)) {
    console.log(`  слот ${x.instance}: ${nameById[x.itemId] || x.itemId} — ${x.matches} матчей, ${(x.wins / x.matches * 100).toFixed(1)}% побед`);
  }
}
