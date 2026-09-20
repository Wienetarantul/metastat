import { medalIcon, medalStars, medalName } from '../lib/ranks.js';

export default function Medal({ rankTier, size = 52 }) {
  const stars = medalStars(rankTier);
  return (
    <div className="medal" style={{ width: size, height: size }} title={medalName(rankTier)}>
      <img src={medalIcon(rankTier)} alt="" loading="lazy" />
      {stars && <img src={stars} alt="" loading="lazy" />}
    </div>
  );
}
