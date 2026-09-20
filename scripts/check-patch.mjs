// Узнаёт текущий патч Dota и сравнивает с тем, по которому собраны закупы.
// Печатает CHANGED=<патч> или SAME=<патч>. Используется в GitHub Actions.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const MARK = new URL('../webapp/public/builds/patch.json', import.meta.url);

export async function currentPatch() {
  const res = await fetch('https://api.opendota.com/api/constants/patch');
  const list = await res.json();
  const last = list[list.length - 1];
  return { name: last.name, date: last.date };
}

export async function savedPatch() {
  try {
    return JSON.parse(await readFile(MARK, 'utf8'));
  } catch {
    return null;
  }
}

export async function savePatch(patch) {
  await writeFile(MARK, JSON.stringify({ ...patch, builtAt: new Date().toISOString().slice(0, 10) }));
}

const runAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (runAsScript) {
  const now = await currentPatch();
  const saved = await savedPatch();
  const changed = !saved || saved.name !== now.name;
  console.log(`${changed ? 'CHANGED' : 'SAME'}=${now.name}${saved ? ` (собрано по ${saved.name})` : ' (отметки ещё нет)'}`);
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `changed=${changed}\npatch=${now.name}\n`, { flag: 'a' });
  }
}
