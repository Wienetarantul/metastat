// Разведка схемы STRATZ: какие поля есть у heroStats (ищем закупы предметов).
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

const QUERY = `{
  __type(name: "HeroStatsQuery") {
    fields { name args { name type { name kind ofType { name } } } type { name kind ofType { name } } }
  }
}`;

const res = await fetch('https://api.stratz.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
    'User-Agent': 'STRATZ_API',
  },
  body: JSON.stringify({ query: QUERY }),
});
const json = await res.json();
if (json.errors) { console.log(JSON.stringify(json.errors, null, 2)); process.exit(1); }
for (const f of json.data.__type.fields) {
  const args = f.args.map((a) => a.name).join(', ');
  console.log(`${f.name}(${args})`);
}
