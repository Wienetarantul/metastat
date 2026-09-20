import g1 from './guides1.js';
import g2 from './guides2.js';
import g3 from './guides3.js';
import g4 from './guides4.js';

// Разборы всех героев по id. Позиции: 1 — керри, 2 — мид, 3 — хард, 4 — роумер, 5 — саппорт.
export const GUIDES = { ...g1, ...g2, ...g3, ...g4 };

export const POSITIONS = [
  { n: 1, name: 'Керри', short: 'Керри', hint: 'Лёгкая линия, фарм, главный урон в поздней игре' },
  { n: 2, name: 'Мид', short: 'Мид', hint: 'Центральная линия, опыт, ганги и темп' },
  { n: 3, name: 'Хард', short: 'Хард', hint: 'Сложная линия, инициация и давление' },
  { n: 4, name: 'Роумер', short: 'Роумер', hint: 'Полусаппорт: ганги, контроль, помощь линиям' },
  { n: 5, name: 'Саппорт', short: 'Саппорт', hint: 'Защита керри, варды, спасение команды' },
];

export const DIFFICULTY = { 1: 'Простой', 2: 'Средний', 3: 'Сложный' };

export function guideFor(id) {
  return GUIDES[id] || null;
}
