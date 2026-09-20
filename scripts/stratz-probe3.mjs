// Пробный реальный запрос закупов: Night Stalker (60), позиция 3, ранги Legend-Ancient.
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

const names = await gql(`{ __schema { types { name } } }`);
console.log('Типы с Rank:', names.__schema.types.map((t) => t.name).filter((n) => n && n.includes('Rank')).join(', '));

const d = await gql(`{
  heroStats {
    itemFullPurchase(heroId: 60, bracketBasicIds: [LEGEND_ANCIENT], positionIds: [POSITION_3]) {
      itemId instance time matchCount winCount winsAverage
    }
  }
}`);
const rows = d.heroStats.itemFullPurchase;
console.log('строк:', rows.length);
console.log(JSON.stringify(rows.slice(0, 12), null, 1));
