import { useMemo } from 'react';
import AccountForm from '../components/AccountForm.jsx';
import { PositionPicker, Difficulty } from '../components/Pickers.jsx';
import { RANK_GROUPS, medalIcon, plural } from '../lib/ranks.js';
import { GUIDES, POSITIONS } from '../data/guides.js';
import { IconBolt, IconChevron } from '../components/Icons.jsx';

const MIN_PICKRATE = 1;

// Оценка героя для игрока: мета ранга + избранное + личные результаты
function scoreHero(hero, group, favSet, mine) {
  const s = hero.groups[group];
  let score = s.winrate;
  if (favSet.has(hero.id)) score += 1;
  // Личный винрейт влияет сильнее, чем больше игр на герое (полный вес — с 10 игр)
  if (mine && mine.games >= 3) score += (mine.win / mine.games - 0.5) * 20 * Math.min(1, mine.games / 10);
  return score;
}

export default function Home({ userName, accountId, onLink, summary, heroes, favorites, myGroup, myPosition, setMyPosition, playerHeroes, openHero, goTo }) {
  const group = RANK_GROUPS.find((g) => g.id === myGroup);
  const pos = POSITIONS.find((p) => p.n === myPosition);
  const player = summary.data?.player;
  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const mineById = useMemo(() => new Map((playerHeroes || []).map((h) => [h.hero_id, h])), [playerHeroes]);
  // Если данных по Титанам нет, берём соседнюю группу
  const dataGroup = heroes.some((h) => h.groups[myGroup]?.picks) ? myGroup : 'high';

  const pool = useMemo(() => {
    if (!myPosition || !heroes.length) return [];
    return heroes
      .filter((h) => GUIDES[h.id]?.p.includes(myPosition))
      .filter((h) => (h.groups[dataGroup].pickrate ?? 0) >= MIN_PICKRATE)
      .map((h) => ({ hero: h, score: scoreHero(h, dataGroup, favSet, mineById.get(h.id)) }))
      .sort((a, b) => b.score - a.score);
  }, [heroes, myPosition, dataGroup, favSet, mineById]);

  const pick = pool[0]?.hero;
  const alternatives = pool.slice(1, 3).map((x) => x.hero);
  const learn = pool.find((x) => GUIDES[x.hero.id].d === 1 && x.hero.id !== pick?.id)?.hero;
  const pickGuide = pick && GUIDES[pick.id];
  const pickMine = pick && mineById.get(pick.id);
  const top = [...pool].sort((a, b) => b.hero.groups[dataGroup].winrate - a.hero.groups[dataGroup].winrate).slice(0, 5).map((x) => x.hero);

  const name = userName || player?.profile?.personaname;

  return (
    <div className="screen">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="col" style={{ gap: 6, minWidth: 0 }}>
          <div className="eyebrow">Подготовка к игре</div>
          <h1 className="h1" style={{ fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ? `Привет, ${name}` : 'Привет!'}</h1>
        </div>
        {player && (
          <button className="profile-chip" onClick={() => goTo('profile')} aria-label="Открыть профиль">
            <img src={player.profile.avatarmedium} alt="" />
            <img className="medal-mini" src={medalIcon(player.rank_tier)} alt="" />
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 10 }}>
          <h2 className="h2">На какой позиции играешь?</h2>
        </div>
        <PositionPicker value={myPosition} onChange={setMyPosition} />
        <p className="small muted" style={{ margin: '10px 0 0' }}>
          {pos ? `${pos.n} позиция — ${pos.hint.toLowerCase()}. Подбор ниже — для ранга ${group?.name}.` : 'Выбери позицию — подберём героев под неё и твой ранг.'}
        </p>
      </div>

      {pick && pickGuide && (
        <button className="card accent" onClick={() => openHero(pick.id)} style={{ textAlign: 'left', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'block', width: '100%' }}>
          <div className="card-head">
            <span className="eyebrow">Что сыграть сейчас</span>
            <IconBolt width={18} height={18} style={{ color: 'var(--lime)' }} />
          </div>
          <img className="hero-banner" src={pick.img} alt="" style={{ aspectRatio: '21 / 9' }} />
          <div className="row" style={{ marginTop: 12, alignItems: 'flex-start' }}>
            <div className="col grow" style={{ gap: 6 }}>
              <span className="h1" style={{ fontSize: 22 }}>{pick.name}</span>
              <Difficulty level={pickGuide.d} />
            </div>
            <div className="col right">
              <span className="h2 num">{pick.groups[dataGroup].winrate.toFixed(1)}%</span>
              <span className="small muted">побед на ранге</span>
            </div>
          </div>
          <p className="text-block" style={{ marginTop: 10 }}>{pickGuide.why}</p>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            {favSet.has(pick.id) ? 'Есть в твоём избранном. ' : ''}
            {pickMine?.games >= 3 ? `У тебя ${Math.round((pickMine.win / pickMine.games) * 100)}% побед за ${pickMine.games} ${plural(pickMine.games, 'игру', 'игры', 'игр')}. ` : ''}
            Берут в {pick.groups[dataGroup].pickrate.toFixed(1)}% игр.
          </p>
          <span className="more-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Открыть разбор, сборку и советы <IconChevron width={16} height={16} />
          </span>
        </button>
      )}

      {alternatives.length > 0 && (
        <div className="card">
          <div className="card-head" style={{ marginBottom: 10 }}><h3 className="h2">Ещё варианты</h3></div>
          <div className="alt-row">
            {alternatives.map((h) => (
              <button key={h.id} className="alt-card" onClick={() => openHero(h.id)}>
                <img src={h.img} alt="" loading="lazy" />
                <span style={{ fontWeight: 700 }}>{h.name}</span>
                <span className="small muted num">{h.groups[dataGroup].winrate.toFixed(1)}% побед</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickGuide && (
        <div className="card glow">
          <div className="eyebrow">Совет на игру · {pick.name}</div>
          <p className="text-block" style={{ marginTop: 8 }}>{pickGuide.team}</p>
          <p className="small muted" style={{ margin: '8px 0 0' }}>Если команда не играет вместе: {pickGuide.solo.charAt(0).toLowerCase() + pickGuide.solo.slice(1)}</p>
        </div>
      )}

      {learn && (
        <button className="card" onClick={() => openHero(learn.id)} style={{ textAlign: 'left', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'block', width: '100%' }}>
          <div className="eyebrow">Легко освоить на {myPosition} позиции</div>
          <div className="row" style={{ marginTop: 10 }}>
            <img className="hero-img" src={learn.img} alt="" loading="lazy" />
            <div className="col grow">
              <span style={{ fontWeight: 700 }}>{learn.name}</span>
              <span className="small muted">{GUIDES[learn.id].plus[0]}</span>
            </div>
            <IconChevron width={18} height={18} style={{ color: 'var(--muted)' }} />
          </div>
        </button>
      )}

      {top.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3 className="h2">Топ на твоей позиции</h3>
            <button className="btn small ghost" onClick={() => goTo('meta')}>Вся мета</button>
          </div>
          <div className="list">
            {top.map((h, i) => (
              <button key={h.id} className="list-item" onClick={() => openHero(h.id)}>
                <span className="rank-num num">{String(i + 1).padStart(2, '0')}</span>
                <img className="hero-icon" src={h.img} alt="" loading="lazy" />
                <span className="grow" style={{ fontWeight: 600 }}>{h.name}</span>
                <span className="num" style={{ fontWeight: 700 }}>{h.groups[dataGroup].winrate.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!accountId && (
        <div className="card">
          <h2 className="h2">Привяжи профиль Dota</h2>
          <p className="small muted" style={{ margin: '6px 0 14px' }}>
            Подберём мету под твой ранг и учтём, на ком ты уже побеждаешь. В Dota 2 должен быть включён общий доступ к данным матчей.
          </p>
          <AccountForm onSubmit={onLink} />
        </div>
      )}

      {dataGroup !== myGroup && (
        <p className="footnote">Для Титанов пока показываем мету Властелин–Божество.</p>
      )}
      <p className="footnote">Данные: OpenDota. Разборы героев — подсказки, а не статистика. MetaStat не связан с Valve.</p>
    </div>
  );
}
