import AccountForm from '../components/AccountForm.jsx';
import Medal from '../components/Medal.jsx';
import { PositionPicker, RankGroupPicker } from '../components/Pickers.jsx';
import { RANK_GROUPS, medalName, plural } from '../lib/ranks.js';
import { isWin } from '../lib/api.js';

function avg(list, key) {
  return list.length ? list.reduce((s, m) => s + (m[key] || 0), 0) / list.length : 0;
}

export default function Profile({
  accountId, onLink, onUnlink, summary, heroById, openHero,
  rankOverride, setRankOverride, autoGroup, myPosition, setMyPosition, favoritesCount, clearFavorites,
}) {
  const player = summary.data?.player;
  const recent = summary.data?.recent || [];
  const wl = summary.data?.wl;
  const deaths = avg(recent, 'deaths');
  const kda = recent.length ? (avg(recent, 'kills') + avg(recent, 'assists')) / Math.max(deaths, 1) : 0;
  const autoName = RANK_GROUPS.find((g) => g.id === autoGroup)?.short;

  return (
    <div className="screen">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Профиль и настройки</div>
        <h1 className="h1">Профиль</h1>
      </div>

      {accountId && summary.loading && <div className="skeleton" style={{ height: 220 }} />}
      {accountId && summary.error && <div className="card"><div className="error">{summary.error}</div></div>}

      {player && (
        <div className="card glow">
          <div className="row">
            <img className="avatar" src={player.profile.avatarfull} alt="" />
            <div className="col grow">
              <span className="h2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.profile.personaname}</span>
              <span className="small muted">{medalName(player.rank_tier)}{player.leaderboard_rank ? ` · место ${player.leaderboard_rank}` : ''}</span>
            </div>
            <Medal rankTier={player.rank_tier} size={64} />
          </div>

          {recent.length > 0 ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between', margin: '16px 0 8px' }}>
                <span className="small muted">Последние {recent.length} {plural(recent.length, 'игра', 'игры', 'игр')}: победы и поражения</span>
                <span className="num" style={{ fontWeight: 700 }}>
                  <span className="pos">{wl.win}</span> <span className="muted">–</span> <span className="neg">{wl.lose}</span>
                </span>
              </div>
              <div className="streak" aria-label={`${wl.win} побед, ${wl.lose} поражений`}>
                {[...recent].reverse().map((m) => (
                  <span key={m.match_id} className={isWin(m) ? 'w' : 'l'} style={{ height: '100%' }} title={isWin(m) ? 'Победа' : 'Поражение'} />
                ))}
              </div>
              <p className="small muted" style={{ margin: '6px 0 0' }}>Зелёный — победа, красный — поражение, слева направо от старых к новым.</p>
              <div className="stats" style={{ marginTop: 14 }}>
                <div className="stat"><div className="label">KDA</div><div className="value num">{kda.toFixed(1)}</div></div>
                <div className="stat"><div className="label">Золото/мин</div><div className="value num">{Math.round(avg(recent, 'gold_per_min'))}</div></div>
                <div className="stat"><div className="label">Добивания</div><div className="value num">{Math.round(avg(recent, 'last_hits'))}</div></div>
              </div>

              <div className="list" style={{ marginTop: 12 }}>
                {recent.slice(0, 5).map((m) => {
                  const h = heroById.get(m.hero_id);
                  const win = isWin(m);
                  return (
                    <button key={m.match_id} className="list-item" onClick={() => h && openHero(h.id)}>
                      {h ? <img className="hero-icon" src={h.img} alt="" loading="lazy" /> : <span className="hero-icon" />}
                      <div className="col grow">
                        <span style={{ fontWeight: 600 }}>{h?.name ?? 'Герой'}</span>
                        <span className="small muted num">{m.kills}/{m.deaths}/{m.assists} · {Math.round(m.duration / 60)} мин</span>
                      </div>
                      <span className={`small ${win ? 'pos' : 'neg'}`} style={{ fontWeight: 700 }}>{win ? 'Победа' : 'Поражение'}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="small muted" style={{ marginBottom: 0 }}>Матчей не видно. Включи в Dota 2: Настройки → Общий доступ к данным матчей.</p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="h2">Моя позиция</h2>
        <p className="small muted" style={{ margin: '6px 0 12px' }}>От неё зависят подбор героев на главной и мета.</p>
        <PositionPicker value={myPosition} onChange={setMyPosition} />
      </div>

      <div className="card">
        <h2 className="h2">Мой ранг для меты</h2>
        <p className="small muted" style={{ margin: '6px 0 12px' }}>
          «Авто» — берём из профиля{autoName ? ` (сейчас ${autoName})` : ''}. Можно выбрать вручную.
        </p>
        <RankGroupPicker value={rankOverride} onChange={setRankOverride} mine={autoGroup} allowAuto autoLabel="Авто" />
      </div>

      <div className="card">
        <div className="card-head">
          <h2 className="h2">Аккаунт Dota</h2>
          {accountId && <span className="tag cyan num">ID {accountId}</span>}
        </div>
        <AccountForm onSubmit={onLink} cta={accountId ? 'Сменить' : 'Привязать'} />
        {accountId && <button className="btn small ghost" style={{ marginTop: 12 }} onClick={onUnlink}>Отвязать</button>}
      </div>

      <div className="card row">
        <div className="col grow">
          <h2 className="h2">Избранные герои</h2>
          <span className="small muted">{favoritesCount} выбрано</span>
        </div>
        <button className="btn small ghost" onClick={clearFavorites} disabled={!favoritesCount}>Очистить</button>
      </div>

      <p className="footnote">MetaStat 0.2 · тестовая версия · данные OpenDota · не связан с Valve</p>
    </div>
  );
}
