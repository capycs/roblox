// Generates Emberfang.glb + preview renders.
//   cd tools/emberfang && npm i && npm run build [-- --renders <dir>]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const outDir = path.join(repo, 'assets/creatures/Emberfang');
const rIdx = process.argv.indexOf('--renders');
const renderDir = rIdx > 0 ? path.resolve(process.argv[rIdx + 1]) : path.join(outDir, 'previews');

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html' };
const page = `<!doctype html><html><body>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">import { runAll } from '/render.js'; window.runAll = runAll; window.ready = true;</script>
</body></html>`;
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page); }
  const f = path.join(here, url);
  if (!f.startsWith(here) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const tab = await browser.newPage();
tab.on('console', (m) => console.log('[page]', m.text()));
tab.on('pageerror', (e) => console.error('[page error]', e.message));
await tab.goto(`http://localhost:${port}/`);
await tab.waitForFunction(() => window.ready === true);
const out = await tab.evaluate(() => window.runAll());
await browser.close(); server.close();

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(renderDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'Emberfang.glb'), Buffer.from(out.glb, 'base64'));
for (const [name, url] of Object.entries(out.images)) {
  fs.writeFileSync(path.join(renderDir, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
}
fs.writeFileSync(path.join(renderDir, 'meta.json'), JSON.stringify({ stats: out.stats, sprites: out.sprites }, null, 2));
console.log(JSON.stringify(out.stats, null, 2));
