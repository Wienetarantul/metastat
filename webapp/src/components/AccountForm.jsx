import { useState } from 'react';
import { parseAccountId } from '../lib/steamId.js';
import { haptic } from '../lib/tg.js';

export default function AccountForm({ onSubmit, cta = 'Привязать', placeholder = 'Friend ID или ссылка на профиль' }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const id = parseAccountId(value);
    if (!id) {
      setError('Не понял ID. Нужен Friend ID из Dota 2 или ссылка на OpenDota, Dotabuff, STRATZ, Steam (…/profiles/…).');
      haptic('error');
      return;
    }
    setError('');
    setValue('');
    haptic('success');
    onSubmit(id);
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label className="small muted" htmlFor="acc-input">Friend ID есть в профиле Dota 2 под ником</label>
      <div className="row">
        <input id="acc-input" className="input" inputMode="text" autoComplete="off" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn cyan" type="submit">{cta}</button>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
