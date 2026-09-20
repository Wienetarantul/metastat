import { useEffect, useMemo, useState } from 'react';
import { getItems } from '../lib/api.js';
import { getHeroBuilds, availableGroups, BUILD_BRACKETS, bracketForRankTier } from '../lib/builds.js';
import { ITEM_WHY } from '../data/items.js';

const POS_LABEL = { 1: '1 Керри', 2: '2 Мид', 3: '3 Хард', 4: '4 Роумер', 5: '5 Саппорт' };

// Куски предметов: сами по себе они ничего не значат, их собирают во что-то большее
const PARTS = new Set([
  'sacred_relic', 'hyperstone', 'demon_edge', 'mystic_staff', 'reaver', 'eaglesong', 'ultimate_orb',
  'point_booster', 'platemail', 'talisman_of_evasion', 'claymore', 'broadsword', 'blades_of_attack',
  'chainmail', 'helm_of_iron_will', 'gloves', 'quarterstaff', 'belt_of_strength', 'boots_of_elves',
  'robe', 'staff_of_wizardry', 'ogre_axe', 'blade_of_alacrity', 'void_stone', 'ring_of_health',
  'vitality_booster', 'energy_booster', 'sobi_mask', 'ring_of_protection', 'blight_stone', 'javelin',
  'mithril_hammer', 'crown', 'band_of_elvenskin', 'cloak', 'blitz_knuckles', 'boots', 'morbid_mask',
  'oblivion_staff', 'perseverance', 'sages_mask', 'headdress', 'lifesteal', 'ring_of_regen',
  'fluffy_hat', 'orb_of_venom', 'blitz_knuckles', 'diadem', 'pers', 'relic',
]);

// Расходники: им место в стартовом закупе, а не в списке предметов
const CONSUMABLES = new Set([
  'tango', 'tango_single', 'flask', 'clarity', 'faerie_fire', 'enchanted_mango', 'blood_grenade',
  'tpscroll', 'dust', 'smoke_of_deceit', 'tome_of_knowledge', 'cheese', 'aegis', 'ward_dispenser',
  'infused_raindrops', 'healing_lotus', 'great_healing_lotus', 'greater_healing_lotus', 'refresher_shard',
]);

// Оставляем только то, что реально стоит в инвентаре: без рецептов, кусков
// и без промежуточных предметов, которые в этой же сборке во что-то собираются.
function cleanBuild(lists, items) {
  const all = lists.flat();
  const usedAsPart = new Set();
  for (const it of all) {
    const info = items?.get(it.id);
    if (info?.components) for (const part of info.components) usedAsPart.add(part);
  }
  const keep = (it) => {
    const info = items?.get(it.id);
    if (!info) return false;
    if (info.key.startsWith('recipe')) return false;
    if (PARTS.has(info.key)) return false;
    if (CONSUMABLES.has(info.key)) return false;
    if (usedAsPart.has(info.key)) return false; // купил сапоги -> позже фазы: показываем фазы
    return true;
  };
  return lists.map((list) => list.filter(keep));
}

function ItemRow({ item, info, total, showTime }) {
  const share = Math.min(100, Math.round((item.n / total) * 100));
  return (
    <div className="item-row">
      {info?.img ? <img className="item-icon" src={info.img} alt="" loading="lazy" /> : <span className="item-icon" />}
      <div className="col grow" style={{ gap: 2 }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{info?.name || `Предмет ${item.id}`}</span>
          {showTime && item.min ? <span className="small muted num" style={{ whiteSpace: 'nowrap' }}>к {Math.round(item.min)} мин</span> : null}
        </div>
        <span className="small muted num">берут в {share}% игр · {item.wr}% побед</span>
        {info && ITEM_WHY[info.key] && <span className="small muted">{ITEM_WHY[info.key]}</span>}
      </div>
    </div>
  );
}

// Стартовый закуп показываем плотным списком — там важен набор, а не порядок
function StartRow({ items, list, total }) {
  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
      {list.map((it) => {
        const info = items?.get(it.id);
        const share = Math.min(100, Math.round((it.n / total) * 100));
        return (
          <span key={it.id} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
            {info?.img && <img src={info.img} alt="" loading="lazy" style={{ width: 28, height: 20, borderRadius: 3 }} />}
            {info?.name || it.id} <span className="muted num">{share}%</span>
          </span>
        );
      })}
    </div>
  );
}

const STAGES = [
  { id: 'early', name: 'Ранние предметы', upTo: 12 },
  { id: 'mid', name: 'Ключевые предметы', upTo: 26 },
  { id: 'late', name: 'Поздняя игра', upTo: Infinity },
];

export default function BuildsBlock({ heroId, rankTier, defaultPosition }) {
  const [state, setState] = useState({ loading: true });
  const [items, setItems] = useState(null);
  const [pos, setPos] = useState(defaultPosition || null);
  const [bracket, setBracket] = useState(bracketForRankTier(rankTier));

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    Promise.all([getHeroBuilds(heroId), getItems()]).then(([builds, itemMap]) => {
      if (!alive) return;
      setItems(itemMap);
      setState({ builds });
    });
    return () => { alive = false; };
  }, [heroId]);

  const groups = useMemo(() => availableGroups(state.builds), [state.builds]);
  const position = groups.positions?.includes(pos) ? pos : groups.positions?.[0];
  const bracketId = groups.brackets?.includes(bracket) ? bracket : groups.brackets?.[0];
  const group = state.builds?.groups?.[`${bracketId}_${position}`];

  const clean = useMemo(() => {
    if (!group || !items) return null;
    const [boots, core] = cleanBuild([group.boots, group.core], items);
    const start = group.start.filter((it) => !items.get(it.id)?.key.startsWith('recipe'));
    return { start, boots, core };
  }, [group, items]);

  if (state.loading) return <div className="skeleton" style={{ height: 180 }} />;
  if (!state.builds || !group || !clean) {
    return <p className="small muted">Для этого героя пока мало матчей в базе закупов. Обновим с новым патчем.</p>;
  }

  const total = Math.max(group.matches, ...group.start.map((i) => i.n), ...group.core.map((i) => i.n));
  const stages = STAGES.map((s, i) => ({
    ...s,
    items: clean.core.filter((it) => it.min < s.upTo && it.min >= (STAGES[i - 1]?.upTo ?? -1)),
  })).filter((s) => s.items.length);

  return (
    <>
      {groups.positions.length > 1 && (
        <div className="segmented" style={{ marginBottom: 8 }}>
          {groups.positions.map((p) => (
            <button key={p} className={p === position ? 'on' : ''} onClick={() => setPos(p)} style={{ minHeight: 34 }}>
              {POS_LABEL[p]}
            </button>
          ))}
        </div>
      )}

      <div className="segmented" style={{ marginBottom: 12 }}>
        {BUILD_BRACKETS.filter((b) => groups.brackets.includes(b.id)).map((b) => (
          <button key={b.id} className={b.id === bracketId ? 'on' : ''} onClick={() => setBracket(b.id)} style={{ minHeight: 34 }}>
            {b.name}
          </button>
        ))}
      </div>

      <div className="build-stage">
        <div className="eyebrow" style={{ marginBottom: 6 }}>Старт на линию</div>
        <StartRow items={items} list={clean.start} total={total} />
      </div>

      {clean.boots.length > 0 && (
        <div className="build-stage">
          <div className="eyebrow" style={{ marginBottom: 4 }}>Ботинки</div>
          {clean.boots.map((it) => <ItemRow key={it.id} item={it} info={items.get(it.id)} total={total} showTime />)}
        </div>
      )}

      {stages.map((stage) => (
        <div key={stage.id} className="build-stage">
          <div className="eyebrow" style={{ marginBottom: 4 }}>{stage.name}</div>
          {stage.items.map((it) => <ItemRow key={it.id} item={it} info={items.get(it.id)} total={total} showTime />)}
        </div>
      ))}

      <p className="small muted" style={{ margin: '8px 0 0' }}>
        Выборка — около {total.toLocaleString('ru-RU')} матчей на {POS_LABEL[position].toLowerCase()} у группы «{BUILD_BRACKETS.find((b) => b.id === bracketId)?.name}». Данные STRATZ.
      </p>
    </>
  );
}
