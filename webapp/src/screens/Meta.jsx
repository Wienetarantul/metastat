import { useMemo, useState } from 'react';
import { RANK_GROUPS } from '../lib/ranks.js';
import { GUIDES, POSITIONS } from '../data/guides.js';
import { PositionPicker, RankGroupPicker } from '../components/Pickers.jsx';

const MIN_PICKRATE = 1; // реже чем в 1% игр — мало данных, не показываем

export default function Meta({ heroes, loading, error, myGroup, myPosition, openHero }) {
  const [group, setGroup] = useState(myGroup);
  const [position, setPosition] = useState(myPosition || 0);
  const [sort, setSort] = useState('winrate');

  const rows = useMemo(() => {
    return heroes
      .filter((h) => (h.groups[group].pickrate ?? 0) >= MIN_PICKRATE)
      .filter((h) => !position || GUIDES[h.id]?.p.includes(position))
      .sort((a, b) => (b.groups[group][sort] ?? 0) - (a.groups[group][sort] ?? 0))
      .slice(0, 25);
  }, [heroes, group, position, sort]);

  const groupInfo = RANK_GROUPS.find((g) => g.id === group);
  const posInfo = POSITIONS.find((p) => p.n === position);
  const noData = !loading && heroes.length > 0 && heroes.every((h) => !h.groups[group].picks);

  return (
    <div className="screen">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Мета · публичные матчи</div>
        <h1 className="h1">Кого брать</h1>
      </div>

      <div className="stack">
        <span className="small muted">Твой ранг</span>
        <RankGroupPicker value={group} onChange={setGroup} mine={myGroup} />
      </div>

      <div className="stack">
        <span className="small muted">Позиция</span>
        <PositionPicker value={position} onChange={setPosition} allowAll />
        {posInfo && <span className="small muted">{posInfo.n} позиция — {posInfo.hint.toLowerCase()}.</span>}
      </div>

      <div className="card">
        <div className="stack" style={{ marginBottom: 8 }}>
          <h2 className="h2">{posInfo ? `${posInfo.name} · ` : ''}{groupInfo.name}</h2>
          <div className="segmented" style={{ padding: 3 }}>
            <button className={sort === 'winrate' ? 'on' : ''} onClick={() => setSort('winrate')} style={{ minHeight: 34 }}>Чаще побеждают</button>
            <button className={sort === 'pickrate' ? 'on' : ''} onClick={() => setSort('pickrate')} style={{ minHeight: 34 }}>Чаще берут</button>
          </div>
        </div>

        {loading && <div className="stack">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>}
        {error && <div className="error">{error}</div>}
        {noData && <div className="empty">Для Титанов OpenDota сейчас не отдаёт статистику. Подключим данные STRATZ.</div>}
        {!loading && !noData && rows.length === 0 && <div className="empty">На этой позиции нет героев с достаточным количеством игр.</div>}

        {!loading && !noData && rows.length > 0 && (
          <div className="list">
            <div className="row small muted" style={{ justifyContent: 'space-between', padding: '4px 0 6px' }}>
              <span>Герой</span>
              <span>Побед · берут</span>
            </div>
            {rows.map((h, i) => {
              const s = h.groups[group];
              return (
                <button key={h.id} className="list-item" onClick={() => openHero(h.id)}>
                  <span className="rank-num num">{String(i + 1).padStart(2, '0')}</span>
                  <img className="hero-img" style={{ width: 56, height: 32 }} src={h.img} alt="" loading="lazy" />
                  <span className="grow" style={{ fontWeight: 600 }}>{h.name}</span>
                  <div className="col right">
                    <span className="num" style={{ fontWeight: 700 }}>{s.winrate.toFixed(1)}%</span>
                    <span className="small muted num">в {s.pickrate.toFixed(1)}% игр</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="footnote">
        Позиции героев — основные для каждого героя. Процент побед — по всем его играм на выбранном ранге; точные цифры по каждой позиции добавим с данными STRATZ.
      </p>
    </div>
  );
}
