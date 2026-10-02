// Draws UI icons into assets/ui/icons/<Name>.png
//   cd tools/art && npm run icons
import path from 'node:path';
import { repo, openPage, writeDataUrl } from './serve.mjs';

const { tab, close } = await openPage('icons.js');
const icons = await tab.evaluate(() => window.M.drawIcons());
for (const [name, url] of Object.entries(icons)) writeDataUrl(path.join(repo, 'assets/ui/icons', name + '.png'), url);
console.log(`${Object.keys(icons).length} icons`);
await close();
