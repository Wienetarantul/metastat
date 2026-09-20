// Обёртка над Telegram WebApp SDK. Вне Telegram всё работает в «браузерном» режиме.
export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
export const inTelegram = Boolean(tg && tg.initData);

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('#070B14');
    tg.setBackgroundColor?.('#070B14');
  } catch {
    // старые версии Telegram — просто пропускаем
  }
}

export function tgUser() {
  return tg?.initDataUnsafe?.user ?? null;
}

export function haptic(kind = 'light') {
  try {
    if (kind === 'success' || kind === 'error') tg?.HapticFeedback?.notificationOccurred(kind);
    else tg?.HapticFeedback?.impactOccurred(kind);
  } catch {
    // нет вибрации — не страшно
  }
}
