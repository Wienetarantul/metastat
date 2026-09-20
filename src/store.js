// Простое хранилище привязок «пользователь Telegram → игрок Dota».
// Для первой версии хватит JSON-файла; позже заменим на базу данных.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/users.json', import.meta.url));

async function load() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch {
    return {};
  }
}

export async function getLinkedAccount(telegramId) {
  const users = await load();
  return users[telegramId]?.accountId ?? null;
}

export async function linkAccount(telegramId, accountId) {
  const users = await load();
  users[telegramId] = { accountId, linkedAt: new Date().toISOString() };
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(users, null, 2));
}
