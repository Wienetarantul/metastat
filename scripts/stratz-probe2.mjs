// Разведка: что именно возвращают закупы и какие значения у рангов/позиций.
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

async function gql(query) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) { console.log('ERRORS', JSON.stringify(json.errors)); process.exit(1); }
  return json.data;
}

const types = ['HeroItemPurchaseType', 'HeroItemStartingPurchaseType', 'HeroItemBootPurchaseType', 'RankBracketBasicEnum', 'MatchPlayerPositionType'];
for (const t of types) {
  const d = await gql(`{ __type(name: "${t}") { name kind fields { name type { name kind ofType { name } } } enumValues { name } } }`);
  const info = d.__type;
  if (!info) { console.log(`${t}: НЕТ ТАКОГО ТИПА`); continue; }
  const fields = (info.fields || []).map((f) => `${f.name}:${f.type.name || f.type.ofType?.name || f.type.kind}`).join(', ');
  const enums = (info.enumValues || []).map((e) => e.name).join(', ');
  console.log(`\n=== ${info.name} (${info.kind})\n${fields || enums}`);
}
