import { useCallback, useEffect, useMemo, useState } from 'react';
import { initTelegram, tgUser, haptic } from './lib/tg.js';
import { load, save } from './lib/storage.js';
import { getHeroes, getPlayerSummary, getPlayerHeroes } from './lib/api.js';
import { groupForRankTier } from './lib/ranks.js';
import Home from './screens/Home.jsx';
import Meta from './screens/Meta.jsx';
import Heroes from './screens/Heroes.jsx';
import { TRACK_LIMIT } from './screens/Tracker.jsx';
import Profile from './screens/Profile.jsx';
import HeroSheet from './components/HeroSheet.jsx';
import { IconHome, IconMeta, IconGrid, IconUser } from './components/Icons.jsx';

const TABS = [
  { id: 'home', label: 'Главная', Icon: IconHome },
  { id: 'meta', label: 'Мета', Icon: IconMeta },
  { id: 'heroes', label: 'Герои', Icon: IconGrid },
  { id: 'profile', label: 'Профиль', Icon: IconUser },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [ready, setReady] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [rankOverride, setRankOverrideState] = useState(null);
  const [myPosition, setMyPositionState] = useState(0);

  const [heroes, setHeroes] = useState([]);
  const [heroesState, setHeroesState] = useState({ loading: true, error: null });
  const [summary, setSummary] = useState({ loading: false, data: null, error: null });
  const [playerHeroes, setPlayerHeroes] = useState([]);
  const [openHeroId, setOpenHeroId] = useState(null);

  // Запуск: Telegram, сохранённые настройки, ID из ссылки бота
  useEffect(() => {
    initTelegram();
    (async () => {
      const urlId = Number(new URLSearchParams(window.location.search).get('id')) || null;
      const [savedId, favs, trk, rank, position] = await Promise.all([
        load('accountId', null),
        load('favorites', []),
        load('tracked', []),
        load('rankGroup', null),
        load('position', 0),
      ]);
      const id = savedId || urlId;
      if (!savedId && urlId) save('accountId', urlId);
      setAccountId(id);
      setFavorites(Array.isArray(favs) ? favs : []);
      setTracked(Array.isArray(trk) ? trk : []);
      setRankOverrideState(rank);
      setMyPositionState(Number(position) || 0);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    getHeroes()
      .then((list) => { setHeroes(list); setHeroesState({ loading: false, error: null }); })
      .catch(() => setHeroesState({ loading: false, error: 'Не удалось загрузить героев. Проверь интернет и обнови приложение.' }));
  }, []);

  useEffect(() => {
    if (!accountId) { setSummary({ loading: false, data: null, error: null }); setPlayerHeroes([]); return; }
    let alive = true;
    setSummary({ loading: true, data: null, error: null });
    getPlayerSummary(accountId)
      .then((data) => alive && setSummary({ loading: false, data, error: null }))
      .catch((e) => alive && setSummary({ loading: false, data: null, error: `${e.message}. Проверь ID в профиле.` }));
    getPlayerHeroes(accountId).then((list) => alive && setPlayerHeroes(list)).catch(() => {});
    return () => { alive = false; };
  }, [accountId]);

  const heroById = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);
  const autoGroup = summary.data?.player?.rank_tier ? groupForRankTier(summary.data.player.rank_tier) : null;
  const myGroup = rankOverride || autoGroup || 'mid';

  const link = useCallback((id) => { setAccountId(id); save('accountId', id); }, []);
  const unlink = useCallback(() => { setAccountId(null); save('accountId', null); }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save('favorites', next);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => { setFavorites([]); save('favorites', []); }, []);

  const addTracked = useCallback((id) => {
    setTracked((prev) => {
      if (prev.includes(id) || prev.length >= TRACK_LIMIT) return prev;
      const next = [id, ...prev];
      save('tracked', next);
      return next;
    });
  }, []);

  const removeTracked = useCallback((id) => {
    setTracked((prev) => {
      const next = prev.filter((x) => x !== id);
      save('tracked', next);
      return next;
    });
  }, []);

  const setRankOverride = useCallback((g) => { setRankOverrideState(g); save('rankGroup', g); }, []);
  const setMyPosition = useCallback((n) => { setMyPositionState(n); save('position', n); }, []);
  const closeHero = useCallback(() => setOpenHeroId(null), []);

  const goTo = useCallback((t) => { setTab(t); haptic('light'); window.scrollTo({ top: 0 }); }, []);

  const openHero = openHeroId ? heroById.get(openHeroId) : null;
  const userName = tgUser()?.first_name;

  if (!ready) return <div className="app-bg" />;

  return (
    <>
      <div className="app-bg" />
      {tab === 'home' && (
        <Home
          userName={userName}
          accountId={accountId}
          onLink={link}
          summary={summary}
          heroes={heroes}
          favorites={favorites}
          myGroup={myGroup}
          myPosition={myPosition}
          setMyPosition={setMyPosition}
          playerHeroes={playerHeroes}
          openHero={setOpenHeroId}
          goTo={goTo}
        />
      )}
      {tab === 'meta' && <Meta key={`${myGroup}-${myPosition}`} heroes={heroes} loading={heroesState.loading} error={heroesState.error} myGroup={myGroup} myPosition={myPosition} openHero={setOpenHeroId} />}
      {tab === 'heroes' && <Heroes heroes={heroes} loading={heroesState.loading} favorites={favorites} toggleFavorite={toggleFavorite} openHero={setOpenHeroId} />}
      {/* Трекер временно скрыт: вернём, когда появятся уведомления о матчах друзей */}
      {tab === 'profile' && (
        <Profile
          accountId={accountId}
          onLink={link}
          onUnlink={unlink}
          summary={summary}
          heroById={heroById}
          openHero={setOpenHeroId}
          myPosition={myPosition}
          setMyPosition={setMyPosition}
          rankOverride={rankOverride}
          setRankOverride={setRankOverride}
          autoGroup={autoGroup}
          favoritesCount={favorites.length}
          clearFavorites={clearFavorites}
        />
      )}

      <nav className="tabbar four" aria-label="Разделы">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => goTo(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {openHero && (
        <HeroSheet
          hero={openHero}
          isFav={favorites.includes(openHero.id)}
          onToggleFav={() => { haptic('light'); toggleFavorite(openHero.id); }}
          myStats={playerHeroes.find((h) => h.hero_id === openHero.id)}
          myGroup={myGroup}
          onClose={closeHero}
        />
      )}
    </>
  );
}
