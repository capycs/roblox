// Renders skyboxes into assets/sky/<Name>/{Bk,Dn,Ft,Lf,Rt,Up}.png (+ a preview strip).
//   cd tools/art && npm run sky
import path from 'node:path';
import { repo, openPage, writeDataUrl } from './serve.mjs';

const { tab, close } = await openPage('sky.js');
const names = await tab.evaluate(() => window.M.SKY_NAMES);
for (const n of names) {
  const faces = await tab.evaluate((x) => window.M.renderSky(x), n);
  for (const [f, url] of Object.entries(faces)) writeDataUrl(path.join(repo, 'assets/sky', n, f + '.png'), url);
  const strip = await tab.evaluate(async (fs) => {
    const order = ['Lf', 'Ft', 'Rt', 'Bk'], c = document.createElement('canvas'); c.width = 4 * 384; c.height = 384;
    for (let i = 0; i < 4; i++) { const im = new Image(); im.src = fs[order[i]]; await im.decode(); c.getContext('2d').drawImage(im, i * 384, 0, 384, 384); }
    return c.toDataURL('image/png');
  }, faces);
  writeDataUrl(path.join(repo, 'assets/sky', n, 'preview.png'), strip);
  console.log('sky', n);
}
await close();
