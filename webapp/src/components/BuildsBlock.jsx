import { useEffect, useMemo, useState } from 'react';
import { getItems } from '../lib/api.js';
import { getHeroBuilds, availableGroups, BUILD_BRACKETS, bracketForRankTier } from '../lib/builds.js';
import { ITEM_WHY } from '../data/items.js';
import { plural } from '../lib/ranks.js';

const POS_LABEL = { 1: '1 Керри', 2: '2 Мид', 3: '3 Хард', 4: '4 Роумер', 5: '5 Саппорт' };

// Строка предмета: иконка, название, цифры из матчей и зачем он нужен
function ItemRow({ item, info, total, showTime }) {
  // Предмет можно купить дважды (браслеты, тряпки), поэтому потолок — 100%
  const share = Math.min(100, Math.round((item.n / total) * 100));
  return (
    <div className="item-row">
      {info?.img ? <img className="item-icon" src={info.img} alt="" loading="lazy" /> : <span className="item-icon" />}
      <div className="col grow" style={{ gap: 2 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{info?.name || `Предмет ${item.id}`}</span>
        <span className="small muted num">
          берут в {share}% игр · {item.wr}% побед{showTime && item.min ? ` · обычно к ${item.min} мин` : ''}
        </span>
        {info && ITEM_WHY[info.key] && <span className="small muted">{ITEM_WHY[info.key]}</span>}
      </div>
    </div>
  );
}

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

  // Выбираем ближайшие доступные позицию и ранг
  const position = groups.positions?.includes(pos) ? pos : groups.positions?.[0];
  const bracketId = groups.brackets?.includes(bracket) ? bracket : groups.brackets?.[0];
  const group = state.builds?.groups?.[`${bracketId}_${position}`];

  if (state.loading) return <div className="skeleton" style={{ height: 180 }} />;
  if (!state.builds || !group) {
    return <p className="small muted">Для этого героя пока мало матчей в базе закупов. Обновим на следующей неделе.</p>;
  }

  // Оценка размера выборки: самый частый предмет из всех трёх списков
  const total = Math.max(
    group.matches,
    ...group.start.map((i) => i.n),
    ...group.boots.map((i) => i.n),
    ...group.core.map((i) => i.n)
  );
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
        <div className="eyebrow" style={{ marginBottom: 4 }}>Стартовый закуп</div>
        {group.start.map((it) => <ItemRow key={it.id} item={it} info={items?.get(it.id)} total={total} />)}
      </div>

      <div className="build-stage">
        <div className="eyebrow" style={{ marginBottom: 4 }}>Ботинки</div>
        {group.boots.map((it) => <ItemRow key={it.id} item={it} info={items?.get(it.id)} total={total} showTime />)}
      </div>

      <div className="build-stage">
        <div className="eyebrow" style={{ marginBottom: 4 }}>Основные предметы по порядку</div>
        {group.core.map((it) => <ItemRow key={it.id} item={it} info={items?.get(it.id)} total={total} showTime />)}
      </div>

      <p className="small muted" style={{ margin: '8px 0 0' }}>
        Выборка — около {total.toLocaleString('ru-RU')} {plural(total, 'матча', 'матчей', 'матчей')} на {POS_LABEL[position].toLowerCase()} у группы «{BUILD_BRACKETS.find((b) => b.id === bracketId)?.name}». Данные STRATZ, обновлены {state.builds.updated}.
      </p>
    </>
  );
}
