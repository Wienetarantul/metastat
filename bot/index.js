// Бот MetaStat, первая версия: привязка игрока и статистика из OpenDota.
// Запуск: npm run bot
import { Bot, InlineKeyboard } from 'grammy';
import { parseAccountId, isVanitySteamLink } from '../src/steamId.js';
import { buildPlayerReport } from '../src/report.js';
import { getLinkedAccount, linkAccount } from '../src/store.js';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  console.error('Не найден файл .env. Скопируйте .env.example в .env и впишите токен бота.');
  process.exit(1);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('В файле .env не заполнен TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const bot = new Bot(token);
// Адрес Mini App (обязательно https). Пока его нет, бот работает без кнопки приложения.
const WEBAPP_URL = process.env.WEBAPP_URL?.trim();

async function appUrlFor(telegramId) {
  const accountId = await getLinkedAccount(telegramId);
  return accountId ? `${WEBAPP_URL}?id=${accountId}` : WEBAPP_URL;
}

const HOW_TO_ID =
  'Пришлите одно из:\n' +
  '• ссылку на профиль OpenDota, Dotabuff или STRATZ (…/players/123456)\n' +
  '• ссылку Steam вида steamcommunity.com/profiles/7656119…\n' +
  '• Friend ID из Dota 2 (число в профиле игры)';

async function replyWithReport(ctx, accountId) {
  await ctx.replyWithChatAction('typing');
  try {
    const text = await buildPlayerReport(accountId);
    await ctx.reply(text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
  } catch (err) {
    console.error(err);
    await ctx.reply('Не получилось загрузить статистику. OpenDota может быть перегружен — попробуйте через минуту.');
  }
}

function readAccountId(ctx, text) {
  if (isVanitySteamLink(text)) {
    ctx.reply('Ссылки Steam с ником пока не поддерживаются.\n\n' + HOW_TO_ID);
    return null;
  }
  const id = parseAccountId(text);
  if (!id) ctx.reply('Не понял, какой это игрок.\n\n' + HOW_TO_ID);
  return id;
}

await bot.api.setMyCommands([
  { command: 'start', description: 'Начать' },
  { command: 'app', description: 'Открыть приложение MetaStat' },
  { command: 'link', description: 'Привязать свой профиль Dota' },
  { command: 'me', description: 'Моя статистика' },
  { command: 'player', description: 'Статистика любого игрока' },
]);

if (WEBAPP_URL) {
  await bot.api.setChatMenuButton({
    menu_button: { type: 'web_app', text: 'MetaStat', web_app: { url: WEBAPP_URL } },
  });
}

bot.command('app', async (ctx) => {
  if (!WEBAPP_URL) return ctx.reply('Приложение ещё не подключено. Скоро!');
  const keyboard = new InlineKeyboard().webApp('Открыть MetaStat', await appUrlFor(ctx.from.id));
  await ctx.reply('Мета, твоя статистика, сетка героев и трекер друзей — всё в приложении.', { reply_markup: keyboard });
});

bot.command('start', async (ctx) => {
  const keyboard = WEBAPP_URL ? new InlineKeyboard().webApp('Открыть MetaStat', await appUrlFor(ctx.from.id)) : undefined;
  await ctx.reply(
    'Привет! Это MetaStat — помощник по Dota 2.\n\n' +
      (WEBAPP_URL ? 'Жми «Открыть MetaStat» — там мета, сетка героев и трекер.\n\n' : '') +
      'Команды:\n' +
      '/link — привязать свой профиль\n' +
      '/me — моя статистика\n' +
      '/player — статистика любого игрока\n\n' +
      'Важно: в настройках Dota 2 должен быть включён общий доступ к данным матчей.',
    { reply_markup: keyboard }
  );
});

bot.command('link', async (ctx) => {
  if (!ctx.match) return ctx.reply('Напишите после команды свой профиль, например:\n/link 123456789\n\n' + HOW_TO_ID);
  const id = readAccountId(ctx, ctx.match);
  if (!id) return;
  await linkAccount(ctx.from.id, id);
  await ctx.reply('Профиль привязан. Вот ваша статистика:');
  await replyWithReport(ctx, id);
});

bot.command('me', async (ctx) => {
  const id = await getLinkedAccount(ctx.from.id);
  if (!id) return ctx.reply('Профиль ещё не привязан. Используйте /link.\n\n' + HOW_TO_ID);
  await replyWithReport(ctx, id);
});

bot.command('player', async (ctx) => {
  if (!ctx.match) return ctx.reply('Напишите после команды профиль игрока, например:\n/player 123456789');
  const id = readAccountId(ctx, ctx.match);
  if (id) await replyWithReport(ctx, id);
});

// Если просто прислали ссылку или число — показываем статистику.
bot.on('message:text', async (ctx) => {
  const id = parseAccountId(ctx.message.text);
  if (id) return replyWithReport(ctx, id);
  await ctx.reply('Не понял сообщение. Список команд — /start');
});

bot.catch((err) => console.error('Ошибка бота:', err));

console.log('MetaStat бот запущен. Остановить: Ctrl+C');
bot.start();
