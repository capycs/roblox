// Generates prop GLBs + previews into assets/props/<Category>/<Name>.
//   cd tools/art && npm run props [-- skyship foliage ...]
import fs from 'node:fs';
import path from 'node:path';
import { here, repo, openPage, writeDataUrl } from './serve.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = args.length ? args : fs.readdirSync(path.join(here, 'props')).map((f) => f.replace(/\.js$/, ''));
const { tab, close } = await openPage('props.js');
for (const file of files) {
  const results = await tab.evaluate((f) => window.M.runProps(f), file);
  for (const out of results) {
    // v2 = the updated set (new trees, new clutter, eggs, icon models...) kept apart from the originals
    const dir = path.join(repo, out.v2 ? 'assets/v2/props' : 'assets/props', out.category, out.name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, out.name + '.glb'), Buffer.from(out.glb, 'base64'));
    for (const [img, url] of Object.entries(out.images)) if (img !== 'iconSprite') writeDataUrl(path.join(dir, img + '.png'), url);
    if (out.images.icon) { fs.mkdirSync(path.join(repo, 'assets/v2/icons'), { recursive: true }); writeDataUrl(path.join(repo, 'assets/v2/icons', out.name + '.png'), out.images.icon); }
    if (out.images.iconSprite) writeDataUrl(path.join(repo, 'assets/v2/icons', out.name + '_spin.png'), out.images.iconSprite);
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ name: out.name, category: out.category, whole: out.whole, stats: out.stats, sprite: out.sprite }, null, 2));
    const tris = Object.values(out.stats.meshes).reduce((s, m) => s + m.tris, 0);
    const big = Object.entries(out.stats.meshes).filter(([, m]) => m.tris > 20000).map(([n]) => n);
    console.log(`${out.category}/${out.name}: ${tris} tris${big.length ? '  OVER 20k: ' + big.join(',') : ''}`);
  }
}
await close();
