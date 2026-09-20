// Проверка связки: id про-матча из OpenDota -> последовательность закупа из STRATZ.
process.loadEnvFile(new URL('../.env', import.meta.url));
const TOKEN = process.env.STRATZ_TOKEN;

async function gql(query) {
  const res = await fetch('https://api.stratz.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'STRATZ_API' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) { console.log('ERRORS', JSON.stringify(json.errors).slice(0, 500)); process.exit(1); }
  return json.data;
}

const pro = await (await fetch('https://api.opendota.com/api/proMatches')).json();
const candidates = [pro[0], pro[20], pro[60], pro[99]].filter(Boolean);
let m = candidates[0];

const items = await (await fetch('https://api.opendota.com/api/constants/items')).json();
const itemName = {};
for (const [key, v] of Object.entries(items)) itemName[v.id] = v.dname || key;

let players = [];
for (const cand of candidates) {
  const d = await gql(`{
    match(id: ${cand.match_id}) {
      didRadiantWin
      players { heroId isVictory position steamAccount { name } stats { itemPurchases { itemId time } } }
    }
  }`);
  players = d.match?.players ?? [];
  m = cand;
  console.log(`Матч ${cand.match_id} («${cand.league_name}»): игроков ${players.length}, закупы у первого ${players[0]?.stats?.itemPurchases?.length ?? 0}`);
  if (players[0]?.stats?.itemPurchases?.length) break;
}
for (const p of players.slice(0, 2)) {
  const buys = (p.stats?.itemPurchases ?? []).map((x) => `${itemName[x.itemId] || x.itemId} (${Math.round(x.time / 60)}м)`);
  console.log(`\n${p.steamAccount?.name} — герой ${p.heroId}, ${p.position}, ${p.isVictory ? 'победа' : 'поражение'}`);
  console.log('  ' + buys.join(' → '));
}
