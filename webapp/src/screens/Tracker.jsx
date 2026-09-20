import { useEffect, useState } from 'react';
import AccountForm from '../components/AccountForm.jsx';
import Medal from '../components/Medal.jsx';
import { getPlayerSummary, isWin } from '../lib/api.js';
import { medalName } from '../lib/ranks.js';
import { IconTrash } from '../components/Icons.jsx';

export const TRACK_LIMIT = 10;

function timeAgo(unix) {
  const min = Math.round((Date.now() / 1000 - unix) / 60);
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.round(h / 24)} дн назад`;
}

function TrackedCard({ id, heroById, onRemove }) {
  const [state, setState] = useState({ loading: true });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getPlayerSummary(id)
      .then((data) => alive && setState({ data }))
      .catch((e) => alive && setState({ error: e.message }));
    return () => { alive = false; };
  }, [id]);

  if (state.loading) return <div className="skeleton" style={{ height: 76 }} />;
  if (state.error) {
    return (
      <div className="card row">
        <div className="grow small"><b>ID {id}</b><div className="error">{state.error}</div></div>
        <button className="icon-btn" aria-label="Убрать" onClick={() => onRemove(id)}><IconTrash width={18} height={18} /></button>
      </div>
    );
  }

  const { player, wl, recent } = state.data;
  const last = recent[0];
  const lastHero = last && heroById.get(last.hero_id);
  const total = wl.win + wl.lose;

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row">
        <button className="row grow" onClick={() => setOpen(!open)} aria-expanded={open} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', padding: 0, textAlign: 'left', cursor: 'pointer', minWidth: 0 }}>
          <img className="avatar" style={{ width: 46, height: 46, borderRadius: 14 }} src={player.profile.avatarmedium} alt="" />
          <div className="col grow">
            <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.profile.personaname}</span>
            <span className="small muted">
              {last ? `${isWin(last) ? 'Победа' : 'Поражение'} · ${lastHero?.name ?? 'герой'} · ${timeAgo(last.start_time)}` : 'Матчей не видно'}
            </span>
          </div>
          <div className="col right">
            <span className="num" style={{ fontWeight: 700 }}>{total ? Math.round((wl.win / total) * 100) : 0}%</span>
            <span className="small muted num">{wl.win}–{wl.lose}</span>
          </div>
          <Medal rankTier={player.rank_tier} size={40} />
        </button>
      </div>

      {open && (
        <div className="list" style={{ marginTop: 10 }}>
          <div className="small muted" style={{ paddingBottom: 6 }}>{medalName(player.rank_tier)} · последние матчи</div>
          {recent.slice(0, 5).map((m) => {
            const h = heroById.get(m.hero_id);
            return (
              <div key={m.match_id} className="list-item" style={{ cursor: 'default' }}>
                {h ? <img className="hero-icon" src={h.img} alt="" loading="lazy" /> : <span className="hero-icon" />}
                <span className="grow">{h?.name ?? 'Герой'}</span>
                <span className="small muted num">{m.kills}/{m.deaths}/{m.assists}</span>
                <span className={`small ${isWin(m) ? 'pos' : 'neg'}`} style={{ fontWeight: 700, width: 26, textAlign: 'right' }}>{isWin(m) ? 'W' : 'L'}</span>
              </div>
            );
          })}
          <button className="btn small ghost" style={{ marginTop: 10 }} onClick={() => onRemove(id)}>
            <IconTrash width={16} height={16} /> Убрать из трекера
          </button>
        </div>
      )}
    </div>
  );
}

export default function Tracker({ tracked, addTracked, removeTracked, heroById }) {
  const full = tracked.length >= TRACK_LIMIT;
  return (
    <div className="screen">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Трекер · {tracked.length} из {TRACK_LIMIT}</div>
        <h1 className="h1">Друзья и соперники</h1>
        <p className="small muted" style={{ margin: 0 }}>Последние матчи, винрейт за 20 игр и ранг. Нажми на игрока, чтобы раскрыть.</p>
      </div>

      <div className="card accent">
        {full ? (
          <p className="small" style={{ margin: 0 }}>Лимит {TRACK_LIMIT} игроков. Убери кого-нибудь, чтобы добавить нового.</p>
        ) : (
          <AccountForm onSubmit={addTracked} cta="Добавить" placeholder="ID или ссылка на игрока" />
        )}
      </div>

      {tracked.length === 0 && <div className="empty">Пока никого. Добавь друга по Friend ID или ссылке на профиль.</div>}

      <div className="stack">
        {tracked.map((id) => (
          <TrackedCard key={id} id={id} heroById={heroById} onRemove={removeTracked} />
        ))}
      </div>

      <p className="footnote">Скоро: уведомления в Telegram, когда друг закончил матч.</p>
    </div>
  );
}
