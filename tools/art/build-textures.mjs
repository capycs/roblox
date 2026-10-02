// Generates ground textures into assets/textures/<Name>/{color,normal,roughness,preview}.png
//   cd tools/art && npm run textures [-- Grass Rock ...]
import fs from 'node:fs';
import path from 'node:path';
import { repo, openPage, writeDataUrl } from './serve.mjs';

const { tab, close } = await openPage('textures.js');
const all = await tab.evaluate(() => window.M.TEXTURE_NAMES);
const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const index = [];
for (const name of names.length ? names : all) {
  const t = await tab.evaluate((n) => window.M.runTexture(n), name);
  const dir = path.join(repo, 'assets/textures', name);
  for (const k of ['color', 'normal', 'roughness', 'preview']) writeDataUrl(path.join(dir, k + '.png'), t[k]);
  index.push({ name, terrain: t.terrain, studsPerTile: t.tile });
  console.log(`${name} -> Terrain ${t.terrain}`);
}
if (!names.length) fs.writeFileSync(path.join(repo, 'assets/textures/index.json'), JSON.stringify(index, null, 2));
await close();
