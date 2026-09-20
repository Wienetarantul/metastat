import { useEffect, useState } from 'react';
import { RANK_GROUPS, groupIcons, plural } from '../lib/ranks.js';
import { guideFor } from '../data/guides.js';
import { tg } from '../lib/tg.js';
import { IconClose, IconStar } from './Icons.jsx';
import { PositionBadges, Difficulty } from './Pickers.jsx';
import BuildsBlock from './BuildsBlock.jsx';

const pct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);

// Вывод по разнице винрейта между низкими и высокими рангами
function rankVerdict(hero) {
  const low = hero.groups.low.winrate;
  const high = hero.groups.high.winrate;
  if (low == null || high == null) return null;
  const diff = high - low;
  const pts = Math.abs(diff).toFixed(1);
  if (diff >= 1.5) {
    return `На высоких рангах побеждает на ${pts}% чаще, чем на Рекрут–Рыцарь. Такому герою нужна точная игра и понимание, когда заходить: новичкам его сила раскрывается хуже.`;
  }
  if (diff <= -1.5) {
    return `На низких рангах побеждает на ${pts}% чаще, чем на Властелин–Божество. Он силён там, где враги меньше координируются и реже собирают контрпредметы, — выше его лучше разбирают.`;
  }
  return 'Процент побед почти не меняется от ранга: герой одинаково полезен и новичкам, и опытным игрокам.';
}

export default function HeroSheet({ hero, isFav, onToggleFav, myStats, myGroup, rankTier, myPosition, onClose }) {
  const [style, setStyle] = useState('team');
  const [more, setMore] = useState(false);

  // Кнопка «Назад» Telegram и Esc закрывают карточку
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const back = tg?.BackButton;
    try { back?.show(); back?.onClick(onClose); } catch { /* старый Telegram */ }
    return () => {
      window.removeEventListener('keydown', onKey);
      try { back?.offClick(onClose); back?.hide(); } catch { /* ignore */ }
    };
  }, [onClose]);

  if (!hero) return null;
  const guide = guideFor(hero.id);
  const verdict = rankVerdict(hero);
  const my = hero.groups[myGroup];

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={hero.name}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="stack" style={{ gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <img className="hero-banner" src={hero.img} alt="" />
            <button className="icon-btn" aria-label="Закрыть" onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(7,11,20,.7)' }}>
              <IconClose />
            </button>
          </div>

          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="col grow" style={{ gap: 8 }}>
              <h2 className="h1">{hero.name}</h2>
              {guide && <PositionBadges positions={guide.p} />}
              {guide && <Difficulty level={guide.d} />}
            </div>
            <button className={`btn small ${isFav ? 'cyan' : 'ghost'}`} onClick={onToggleFav} aria-pressed={isFav}>
              <IconStar width={16} height={16} /> {isFav ? 'В избранном' : 'В избранное'}
            </button>
          </div>

          {my?.picks > 0 && (
            <div className="stats">
              <div className="stat"><div className="label">Побед на твоём ранге</div><div className="value num">{pct(my.winrate)}</div></div>
              <div className="stat"><div className="label">Берут в играх</div><div className="value num">{pct(my.pickrate)}</div></div>
              <div className="stat">
                <div className="label">Ты на нём</div>
                <div className="value num">{myStats?.games ? `${Math.round((myStats.win / myStats.games) * 100)}%` : '—'}</div>
              </div>
            </div>
          )}
          {myStats?.games > 0 && (
            <p className="small muted" style={{ margin: '-6px 0 0' }}>
              «Ты на нём» — твой процент побед за {myStats.games} {plural(myStats.games, 'игру', 'игры', 'игр')} из последних 100.
            </p>
          )}

          {guide ? (
            <div className="card glow">
              <div className="eyebrow">Почему на этих позициях</div>
              <p className="text-block" style={{ marginTop: 8 }}>{guide.why}</p>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {guide.s.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
              {guide.check && (
                <p className="small muted" style={{ margin: '10px 0 0' }}>Новый герой — разбор сверяем с текущим патчем.</p>
              )}

              {more && (
                <div className="pm" style={{ marginTop: 14 }}>
                  <div className="plus">
                    <span className="small" style={{ fontWeight: 700, color: 'var(--green)' }}>Плюсы</span>
                    <ul>{guide.plus.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div className="minus">
                    <span className="small" style={{ fontWeight: 700, color: 'var(--red)' }}>Минусы</span>
                    <ul>{guide.minus.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                </div>
              )}
              <button className="more-btn" onClick={() => setMore(!more)} aria-expanded={more}>
                {more ? 'Скрыть плюсы и минусы' : 'Подробнее: плюсы и минусы'}
              </button>
            </div>
          ) : null}

          {guide && (
            <div className="card">
              <div className="card-head">
                <h3 className="h2">Как играть</h3>
              </div>
              <div className="segmented" style={{ marginBottom: 12 }}>
                <button className={style === 'team' ? 'on' : ''} onClick={() => setStyle('team')}>С командой</button>
                <button className={style === 'solo' ? 'on' : ''} onClick={() => setStyle('solo')}>Соло</button>
              </div>
              <p className="text-block">{style === 'team' ? guide.team : guide.solo}</p>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h3 className="h2">Сборка и зачем</h3>
              <span className="tag cyan">по рангам</span>
            </div>
            <BuildsBlock heroId={hero.id} rankTier={rankTier} defaultPosition={myPosition || guide?.p?.[0]} />
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="h2">Мета по рангам</h3>
              <span className="tag cyan">OpenDota</span>
            </div>
            <table className="rank-table">
              <thead>
                <tr><th>Ранг</th><th>Побед</th><th>Берут в играх</th></tr>
              </thead>
              <tbody>
                {RANK_GROUPS.map((g) => {
                  const s = hero.groups[g.id];
                  return (
                    <tr key={g.id} className={g.id === myGroup ? 'mine' : ''}>
                      <td>
                        <span className="rank-cell">
                          <img src={groupIcons(g.id).slice(-1)[0]} alt="" loading="lazy" />
                          {g.short}
                        </span>
                      </td>
                      <td className="num">{s.picks ? pct(s.winrate) : '—'}</td>
                      <td className="num">{s.picks ? pct(s.pickrate) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {verdict && <p className="text-block small" style={{ marginTop: 12, color: 'var(--text)' }}>{verdict}</p>}
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              «Побед» — сколько процентов игр герой выигрывает. «Берут в играх» — в каком проценте матчей он есть. Для Титанов данных пока нет.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
