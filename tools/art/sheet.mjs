// Composes preview PNGs into one labelled grid: node sheet.mjs out.png cols cell a.png b.png ...
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
const [, , out, cols, cell, ...files] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
const imgs = files.map((f) => ({ src: 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'), label: path.basename(path.dirname(f)) }));
const url = await p.evaluate(async ({ imgs, cols, cell }) => {
  const rows = Math.ceil(imgs.length / cols), c = document.createElement('canvas');
  c.width = cols * cell; c.height = rows * (cell + 28);
  const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < imgs.length; i++) {
    const im = new Image(); im.src = imgs[i].src; await im.decode();
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 28), s = Math.min(cell / im.width, cell / im.height);
    g.drawImage(im, x + (cell - im.width * s) / 2, y, im.width * s, im.height * s);
    g.fillStyle = '#fff'; g.font = '16px sans-serif'; g.fillText(imgs[i].label, x + 6, y + cell + 20);
  }
  return c.toDataURL();
}, { imgs, cols: +cols, cell: +cell });
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
await b.close();
