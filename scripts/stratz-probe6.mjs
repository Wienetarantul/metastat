// Разведка под варианты сборок: можно ли достать последовательности закупов из матчей.
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

async function gql(query) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) { console.log('ERRORS', JSON.stringify(json.errors).slice(0, 400)); return null; }
  return json.data;
}

const q = await gql(`{ __schema { queryType { fields { name args { name } } } } }`);
console.log('=== корневые запросы:');
for (const f of q.__schema.queryType.fields) console.log(`  ${f.name}(${f.args.map((a) => a.name).join(', ')})`);

const p = await gql(`{ __type(name: "MatchPlayerType") { fields { name } } }`);
if (p) console.log('\n=== поля игрока в матче:\n  ' + p.__type.fields.map((f) => f.name).join(', '));

const s = await gql(`{ __type(name: "MatchPlayerStatsType") { fields { name } } }`);
if (s) console.log('\n=== stats игрока:\n  ' + s.__type.fields.map((f) => f.name).join(', '));
