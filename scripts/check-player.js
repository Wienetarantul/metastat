// Проверка данных без бота: npm run check -- 123456789
import { parseAccountId } from '../src/steamId.js';
import { buildPlayerReport } from '../src/report.js';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // .env не обязателен для проверки
}

const input = process.argv[2];
const id = parseAccountId(input);
if (!id) {
  console.log('Укажите ID игрока или ссылку: npm run check -- 123456789');
  process.exit(1);
}

const text = await buildPlayerReport(id);
console.log(text.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
