// One-off: crops the collateral preview artwork out of the Zonal Manager mockups (ZM.7a / 7b / 7c / 8 / 8a)
// into src/assets/collateral/. Uses headless Chrome over CDP and a canvas (no image library needed).
// Usage: node scripts/crop-collateral.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SRC = path.join(root, 'docs/mockups/zonal-manager');
const OUT = path.join(root, 'src/assets/collateral');
/** [output name, mockup, x, y, width, height] in mockup pixels (1280 × 720). */
const CROPS = [
  ['template-detailer', 'ZM.7a.png', 204, 276, 196, 176],
  ['template-leaflet', 'ZM.7a.png', 556, 276, 191, 176],
  ['template-whatsapp', 'ZM.7a.png', 200, 484, 200, 158],
  ['template-poster', 'ZM.7a.png', 556, 484, 191, 158],
  ['onion-bulbs', 'ZM.7b.png', 640, 300, 219, 180],
  ['product-pack', 'ZM.7b.png', 352, 468, 118, 146],
  ['onion-field', 'ZM.7a.png', 694, 486, 53, 94],
  ['onion-rows', 'ZM.7a.png', 668, 282, 79, 106],
  ['onion-harvest', 'ZM.8.png', 1140, 230, 126, 88],
  ['asset-preview', 'ZM.8.png', 981, 144, 285, 174],
  ['playbook-detailer', 'ZM.8a.png', 206, 230, 138, 108],
  ['playbook-leaflet', 'ZM.8a.png', 389, 230, 138, 108],
  ['playbook-whatsapp', 'ZM.8a.png', 568, 230, 138, 108],
  ['playbook-poster', 'ZM.8a.png', 747, 230, 128, 108],
];

const PORT = 9700 + Math.floor(Math.random() * 90);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TEMP}/v3crop-${process.pid}`, 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs;
for (let i = 0; i < 60; i++) { await wait(500); try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { /* not up yet */ } if (Array.isArray(tabs) && tabs.find((t) => t.type === 'page')) break; }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

fs.mkdirSync(OUT, { recursive: true });
for (const [name, file, x, y, w, h] of CROPS) {
  const data = fs.readFileSync(path.join(SRC, file)).toString('base64');
  const expr = `new Promise((res) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = ${w * 2}; c.height = ${h * 2};
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, ${x}, ${y}, ${w}, ${h}, 0, 0, ${w * 2}, ${h * 2}); res(c.toDataURL('image/png')); }; img.src = 'data:image/png;base64,${data}'; })`;
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.result.value.split(',')[1], 'base64'));
  console.log(`${name}.png  ${file} ${x},${y} ${w}×${h}`);
}
chrome.kill();
process.exit(0);
