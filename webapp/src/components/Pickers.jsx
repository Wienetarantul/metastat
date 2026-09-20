import { RANK_GROUPS, groupIcons } from '../lib/ranks.js';
import { POSITIONS } from '../data/guides.js';
import { haptic } from '../lib/tg.js';

// Выбор группы рангов картинками медалей
export function RankGroupPicker({ value, onChange, mine, allowAuto = false, autoLabel }) {
  const options = allowAuto ? [{ id: null, name: autoLabel || 'Авто' }, ...RANK_GROUPS] : RANK_GROUPS;
  return (
    <div className="rank-picker" role="radiogroup" aria-label="Группа рангов">
      {options.map((g) => {
        const on = value === g.id;
        const icons = g.id ? groupIcons(g.id) : [];
        return (
          <button
            key={g.id ?? 'auto'}
            role="radio"
            aria-checked={on}
            className={`rank-option ${on ? 'on' : ''}`}
            onClick={() => { haptic('light'); onChange(g.id); }}
          >
            <span className="rank-icons">
              {icons.length ? icons.map((src) => <img key={src} src={src} alt="" loading="lazy" />) : <span className="rank-auto">A</span>}
            </span>
            <span className="rank-label">{g.id ? g.short : g.name}</span>
            {mine && g.id === mine && <span className="rank-mine">твой</span>}
          </button>
        );
      })}
    </div>
  );
}

// Выбор позиции 1–5
export function PositionPicker({ value, onChange, allowAll = false }) {
  const options = allowAll ? [{ n: 0, short: 'Все' }, ...POSITIONS] : POSITIONS;
  return (
    <div className="pos-picker" role="radiogroup" aria-label="Позиция">
      {options.map((p) => {
        const on = value === p.n;
        return (
          <button key={p.n} role="radio" aria-checked={on} className={`pos-option ${on ? 'on' : ''}`} onClick={() => { haptic('light'); onChange(p.n); }}>
            {p.n > 0 && <span className="pos-num">{p.n}</span>}
            <span className="pos-name">{p.short}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PositionBadges({ positions }) {
  return (
    <span className="pos-badges">
      {positions.map((n) => {
        const p = POSITIONS.find((x) => x.n === n);
        return <span key={n} className="pos-badge" title={p?.hint}>{n} · {p?.short}</span>;
      })}
    </span>
  );
}

export function Difficulty({ level }) {
  const label = { 1: 'Простой', 2: 'Средний', 3: 'Сложный' }[level];
  return (
    <span className="difficulty" aria-label={`Сложность: ${label}`}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= level ? 'on' : ''} />)}
      <span className="difficulty-label">{label}</span>
    </span>
  );
}
