// Draws particle textures into assets/fx/textures and effect previews into assets/fx/previews.
//   cd tools/art && npm run fx
import { repo, openPage, writeDataUrl } from './serve.mjs';
import path from 'node:path';
import fs from 'node:fs';

const { tab, close } = await openPage('fx.js');
const tex = await tab.evaluate(() => window.M.drawTextures());
for (const [name, url] of Object.entries(tex)) writeDataUrl(path.join(repo, 'assets/fx/textures', name + '.png'), url);
const prev = await tab.evaluate((t) => window.M.previewEffects(t), tex);
const meta = {};
for (const [name, p] of Object.entries(prev)) { writeDataUrl(path.join(repo, 'assets/fx/previews', name + '.png'), p.sheet); meta[name] = { frames: p.frames, duration: p.duration }; }
fs.writeFileSync(path.join(repo, 'assets/fx/previews/meta.json'), JSON.stringify(meta, null, 2));
console.log(`${Object.keys(tex).length} textures, ${Object.keys(prev).length} previews`);
await close();
