// Проверка: можно ли одним запросом взять все ранги и позиции сразу.
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

async function gql(query) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) { console.log('ERRORS', JSON.stringify(json.errors).slice(0, 600)); process.exit(1); }
  return json.data;
}

const BR = '[HERALD_GUARDIAN, CRUSADER_ARCHON, LEGEND_ANCIENT, DIVINE_IMMORTAL]';
const POS = '[POSITION_1, POSITION_2, POSITION_3, POSITION_4, POSITION_5]';

const d = await gql(`{
  heroStats {
    full: itemFullPurchase(heroId: 60, bracketBasicIds: ${BR}, positionIds: ${POS}) { bracketBasicIds position itemId instance time matchCount winCount }
    start: itemStartingPurchase(heroId: 60, bracketBasicIds: ${BR}, positionIds: ${POS}) { bracketBasicIds position itemId matchCount winCount }
    boots: itemBootPurchase(heroId: 60, bracketBasicIds: ${BR}, positionIds: ${POS}) { bracketBasicIds position itemId timeAverage matchCount winCount }
  }
}`);

for (const [k, rows] of Object.entries(d.heroStats)) {
  const br = new Set(rows.map((r) => r.bracketBasicIds));
  const pos = new Set(rows.map((r) => r.position));
  console.log(`${k}: строк ${rows.length}, рангов ${br.size} (${[...br].join('/')}), позиций ${pos.size} (${[...pos].join('/')})`);
}
console.log('\nпример full:', JSON.stringify(d.heroStats.full[0]));
console.log('пример start:', JSON.stringify(d.heroStats.start[0]));
console.log('пример boots:', JSON.stringify(d.heroStats.boots[0]));
