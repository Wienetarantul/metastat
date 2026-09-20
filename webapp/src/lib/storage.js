// Хранилище настроек: облако Telegram (синхронизируется между устройствами),
// а вне Telegram — память браузера.
import { tg, inTelegram } from './tg.js';

const useCloud = inTelegram && tg?.CloudStorage && tg.isVersionAtLeast?.('6.9');

function cloudGet(key) {
  return new Promise((resolve) => {
    tg.CloudStorage.getItem(key, (err, value) => resolve(err ? null : value || null));
  });
}

function cloudSet(key, value) {
  return new Promise((resolve) => {
    tg.CloudStorage.setItem(key, value, () => resolve());
  });
}

export async function load(key, fallback) {
  try {
    const raw = useCloud ? await cloudGet(key) : localStorage.getItem('metastat:' + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function save(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (useCloud) await cloudSet(key, raw);
    else localStorage.setItem('metastat:' + key, raw);
  } catch {
    // хранилище недоступно — настройки проживут до закрытия приложения
  }
}
