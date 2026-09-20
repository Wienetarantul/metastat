import { useMemo, useState } from 'react';
import { ATTRS } from '../lib/api.js';
import { haptic } from '../lib/tg.js';
import { IconSearch } from '../components/Icons.jsx';

export default function Heroes({ heroes, loading, favorites, toggleFavorite, openHero }) {
  const [mode, setMode] = useState('pick');
  const [query, setQuery] = useState('');
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? heroes.filter((h) => h.name.toLowerCase().includes(q)) : heroes;
  }, [heroes, query]);

  function onTile(h) {
    if (mode === 'pick') {
      haptic('light');
      toggleFavorite(h.id);
    } else {
      openHero(h.id);
    }
  }

  return (
    <div className="screen">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Герои · {favorites.length} в избранном</div>
        <h1 className="h1">Твой пул героев</h1>
      </div>

      <div className="segmented">
        <button className={mode === 'pick' ? 'on' : ''} onClick={() => setMode('pick')}>Выбрать любимых</button>
        <button className={mode === 'view' ? 'on' : ''} onClick={() => setMode('view')}>Смотреть героев</button>
      </div>

      <div className="row" style={{ position: 'relative' }}>
        <IconSearch width={18} height={18} style={{ position: 'absolute', left: 14, color: 'var(--dim)' }} />
        <input className="input" style={{ paddingLeft: 40 }} placeholder="Найти героя" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Поиск героя" />
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        {mode === 'pick' ? 'Нажми на героя, чтобы добавить или убрать его из избранного.' : 'Нажми на героя, чтобы открыть его карточку.'}
      </p>

      {loading && <div className="skeleton" style={{ height: 320 }} />}

      {ATTRS.map((attr) => {
        const list = filtered.filter((h) => h.attr === attr.id);
        if (!list.length) return null;
        return (
          <section key={attr.id} className="card" style={{ padding: 12 }}>
            <div className="attr-title">
              <span className="attr-dot" style={{ background: attr.color, boxShadow: `0 0 10px ${attr.color}` }} />
              {attr.name}
              <span className="small muted" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{list.length}</span>
            </div>
            <div className="hero-grid">
              {list.map((h) => {
                const fav = favSet.has(h.id);
                const dim = mode === 'pick' && favorites.length > 0 && !fav;
                return (
                  <button
                    key={h.id}
                    className={`hero-tile ${fav ? 'fav' : ''} ${dim ? 'dim' : ''}`}
                    onClick={() => onTile(h)}
                    aria-pressed={mode === 'pick' ? fav : undefined}
                    aria-label={h.name}
                  >
                    <img src={h.img} alt="" loading="lazy" />
                    <span className="name">{h.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="footnote">Скоро: сетка «нелюбимых» героев — будем подсказывать, как против них играть.</p>
    </div>
  );
}
