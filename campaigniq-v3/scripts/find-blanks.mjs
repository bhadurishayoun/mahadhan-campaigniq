// Finds empty or placeholder values on every route, drawer and modal (headless Chrome over CDP; Playwright is not installed).
// Usage: start `npx vite preview --port 4174`, then `npm run check:blanks` (or `node scripts/find-blanks.mjs [filter]`).
// Lists every table cell, KPI value, card value and chip whose text is empty or only a dash, NA, N/A, Pending, TBD or 0.
// Exit code 1 when anything is found.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4174/';
const filter = process.argv[2] || '';
const W = 1440, H = 900;

// Every route in the screenshot list, plus the per-territory routes of the Zonal Manager.
const shots = fs.readFileSync(new URL('./shots.mjs', import.meta.url), 'utf8');
const routes = [...shots.matchAll(/\['([\w-]+)', '([^']+)'\]/g)].map((m) => m[2]);
const ZM_T = ['ambad', 'ghansawangi', 'badnapur', 'jafrabad', 'bhokardan', 'partur', 'mantha', 'jalna'];
for (const t of ZM_T) routes.push(`/zm/plans/${t}/review`, `/zm/plans/${t}/revised`, `/zm/approvals/${t}`);
const ROUTES = [...new Set(routes)].filter((r) => r.includes(filter));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', `--user-data-dir=${process.env.TEMP}/blanks-${PORT}`, 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) { await wait(200); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); } catch { /* starting */ } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const signIn = async () => {
  await send('Page.navigate', { url: BASE }); await wait(2000);
  await ev(`(() => { const f = document.querySelectorAll('.login-field input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  ['Review', 'MASTER001', 'Mahadhan@2026'].forEach((v, i) => { set.call(f[i], v); f[i].dispatchEvent(new Event('input', { bubbles: true })); }); document.querySelector('.login-cta')?.click(); })()`);
  await wait(1500);
  return ev("!!document.querySelector('main')");
};
let signedIn = false;
for (let i = 0; i < 3 && !signedIn; i++) signedIn = await signIn();
if (!signedIn) { console.error('Sign-in failed'); chrome.kill(); process.exit(2); }

/** In-page scan of a root element; returns [where, column, row, text]. */
const SCAN = (root) => `(() => {
  const BLANK = /^(|—|–|-|NA|N\\/A|Pending|TBD|0)$/i;
  const T = (el) => (el?.innerText ?? '').replace(/\\s+/g, ' ').trim();
  const root = ${root};
  if (!root) return [];
  const out = [];
  const cardOf = (el) => T(el.closest('.card, .drawer, .modal')?.querySelector('.card-title-text, h2')) || 'page';
  const numeric = (s) => /^[₹+–−-]?[\\d,.]+\\s*(%|×|L|Cr|pp|units)?/.test(s);
  for (const table of root.querySelectorAll('table.tbl')) {
    const heads = [...table.querySelectorAll('thead th')].map(T);
    const body = [...table.querySelectorAll('tbody tr')];
    body.forEach((tr) => {
      const cells = [...tr.children];
      const total = tr.classList.contains('total');
      const rowName = cells.map(T).find((x) => x && !BLANK.test(x)) || '(row)';
      cells.forEach((td, i) => {
        if (td.querySelector('input, .radio, .check, select, button, svg') && !T(td)) return;
        const text = T(td);
        if (!BLANK.test(text)) return;
        if (total && !text) {
          // Total rows: only numeric columns must carry a total.
          const col = body.filter((r) => !r.classList.contains('total')).map((r) => T(r.children[i]));
          if (!col.length || !col.every((x) => numeric(x) || BLANK.test(x)) || !col.some(numeric)) return;
        }
        out.push([cardOf(table), heads[i] || '(column ' + (i + 1) + ')', rowName, text || '(empty)']);
      });
    });
  }
  for (const k of root.querySelectorAll('.kpi')) { const v = T(k.querySelector('.kpi-value')); if (BLANK.test(v)) out.push(['KPI', T(k.querySelector('.kpi-label')), '', v || '(empty)']); }
  for (const r of root.querySelectorAll('.list-row')) { const b = r.querySelector('b.right'); if (b && !b.querySelector('button, select, input') && BLANK.test(T(b))) out.push([cardOf(r), T(r.querySelector('span')), '', T(b) || '(empty)']); }
  for (const r of root.querySelectorAll('.kv')) { const b = r.querySelector('b'); if (b && BLANK.test(T(b))) out.push([cardOf(r), T(r.querySelector('span')), '', T(b) || '(empty)']); }
  for (const c of root.querySelectorAll('.chip')) { if (BLANK.test(T(c))) { const tr = c.closest('tr'); out.push([cardOf(c), 'chip', tr ? T(tr.children[0]) || T(tr.children[1]) : T(c.parentElement), T(c) || '(empty)']); } }
  return out;
})()`;

const hits = new Map();
const add = (route, rows, via = '') => rows.forEach(([where, col, row, text]) => {
  const key = [route, where, col, row, text].join(' | ');
  if (!hits.has(key)) hits.set(key, `${route}${via ? ` [${via}]` : ''}  ${where} · ${col}${row ? ` · ${row}` : ''}  → "${text}"`);
});
const go = async (r) => { await ev(`location.hash = ${JSON.stringify(r)}`); await wait(650); };
const overlay = () => ev(`!!document.querySelector('.drawer, .modal')`);
const closeOverlay = async () => { for (let i = 0; i < 3 && await overlay(); i++) { await ev(`(document.querySelector('.drawer [aria-label=Close], .modal [aria-label=Close]') || document.querySelector('.scrim'))?.click()`); await wait(250); } };

for (const r of ROUTES) {
  await go(r);
  if (await overlay()) { add(r, await ev(SCAN(`document.querySelector('.drawer, .modal')`)), 'open on load'); await closeOverlay(); }
  add(r, await ev(SCAN(`document.querySelector('main')`)));
  // Open every drawer / modal reachable from a button on the page (footer navigation excluded).
  const labels = await ev(`[...document.querySelectorAll('main button:not(:disabled)')].filter((b) => !b.closest('.footer, nav, .seg, .step-tabs, .unsaved-bar') && b.innerText.trim()).map((b) => b.innerText.trim())`) || [];
  for (const [i, label] of [...new Set(labels)].entries()) {
    if (/^(save|cancel|stay|discard|ask|send)/i.test(label)) continue;
    await ev(`[...document.querySelectorAll('main button:not(:disabled)')].find((b) => b.innerText.trim() === ${JSON.stringify(label)} && !b.closest('.footer'))?.click()`);
    await wait(350);
    if (await overlay()) { add(r, await ev(SCAN(`document.querySelector('.drawer, .modal')`)), label); await closeOverlay(); }
    const here = await ev('location.hash');
    if (here !== `#${r}`) await go(r);
    if (i > 40) break;
  }
  process.stdout.write('.');
}
console.log('');
for (const line of hits.values()) console.log(line);
console.log(`${hits.size} blank value(s) on ${ROUTES.length} routes`);
chrome.kill();
process.exit(hits.size ? 1 : 0);
