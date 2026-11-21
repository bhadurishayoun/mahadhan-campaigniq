// Screenshots of every route with headless Chrome over CDP (Playwright is not installed).
// Usage: start `npx vite preview --port 4174` first, then `node scripts/shots.mjs [filter] [width] [height]`.
// Signs in with the master session, saves PNGs to docs/screens/, and reports console errors, horizontal scroll
// and clipped text per route.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:4174/';
const filter = process.argv[2] || '';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const out = path.resolve('docs/screens');
fs.mkdirSync(out, { recursive: true });

const ROUTES = [
  ['01-command-centre', '/bh/command-centre'],
  ['02-portfolio', '/bh/portfolio'],
  ['03-region-west', '/bh/portfolio/region/west'],
  ['03-region-north', '/bh/portfolio/region/north'],
  ['04-territory-ambad', '/bh/portfolio/territory/ambad'],
  ['05-effectiveness-west', '/bh/portfolio/region/west/effectiveness'],
  ['06-diagnostics-drawer', '/bh/portfolio/region/west/effectiveness?campaign=croptek&drawer=diagnostics'],
  ['07-investment', '/bh/investment'],
  ['08-campaign-investment', '/bh/investment/region/west'],
  ['09-returns', '/bh/investment/region/west/returns'],
  ['10-reallocation', '/bh/investment/region/west/reallocation'],
  ['11-opportunity', '/bh/themes/opportunity'],
  ['12-inbox', '/bh/themes/inbox'],
  ['13-review', '/bh/themes/croptek-next/review'],
  ['14-decision-modal', '/bh/themes/croptek-next/review?modal=decision'],
  ['15-suggest', '/bh/themes/suggest'],
  ['16-submit-drawer', '/bh/themes/suggest?drawer=submit'],
  ['17-tracker', '/bh/interventions'],
  ['18-intervention-drawer', '/bh/interventions?drawer=croptek-review'],
  ['19-learning', '/bh/interventions/learning'],
  ['20-assistant', '/bh/assistant'],
  ['fsm-01-plan', '/fsm/plan'],
  ['fsm-02-network', '/fsm/plan/network/ambad'],
  ['fsm-03-outlets', '/fsm/plan/outlets/ambad'],
  ['fsm-04-crop', '/fsm/plan/crop/ambad'],
  ['fsm-05-review', '/fsm/plan/review/ambad'],
  ['fsm-06-campaigns', '/fsm/campaigns'],
  ['fsm-07-objective', '/fsm/campaigns/new/objective'],
  ['fsm-08-activities', '/fsm/campaigns/new/activities'],
  ['fsm-09-scenario', '/fsm/campaigns/new/scenario'],
  ['fsm-10-wizard-review', '/fsm/campaigns/new/review'],
  ['fsm-11-execution', '/fsm/execution'],
  ['fsm-12-activity', '/fsm/execution/dhanora-field-demonstration'],
  ['fsm-13-impact', '/fsm/impact'],
  ['fsm-14-diagnostic', '/fsm/impact/diagnostic'],
  ['fsm-15-assistant', '/fsm/assistant'],
].filter(([n]) => n.includes(filter));

const PORT = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TEMP}/v3shots-${process.pid}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs;
for (let i = 0; i < 60; i++) { await wait(500); try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch {} if (Array.isArray(tabs) && tabs.find((t) => t.type === 'page')) break; }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.split('\n')[0]);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE });
await wait(1500);
await ev(`localStorage.setItem('campaigniq.session.v2', JSON.stringify({name:'Review',persona:'strategy',userId:'MASTER001',master:true})); localStorage.removeItem('campaigniq.v3.bh'); true`);
await send('Page.reload'); await wait(1500);
// Optional: pick top-bar menu items by label, e.g. PICK="Q3 · Oct–Dec 2026|West region" (opens each top-bar menu and clicks the item).
for (const label of (process.env.PICK || '').split('|').filter(Boolean)) {
  await ev(`(async () => { for (const t of document.querySelectorAll('.tb-select')) { t.click(); await new Promise(r => setTimeout(r, 150)); const b = [...document.querySelectorAll('.menu button')].find(x => x.textContent.trim() === ${JSON.stringify(label)}); if (b) { b.click(); return true; } t.click(); } return false; })()`);
  await wait(400);
}

for (const [name, route] of ROUTES) {
  errors.length = 0;
  await ev(`location.hash = '#${route}'; true`);
  await wait(1800);
  const info = await ev(`(() => {
    const main = document.querySelector('.main');
    const h = Math.max(${H}, (main ? main.scrollHeight + 60 : 0), document.documentElement.scrollHeight);
    const hscroll = document.documentElement.scrollWidth > window.innerWidth + 1 || (main && main.scrollWidth > main.clientWidth + 1);
    const clipped = [...document.querySelectorAll('.page *, .drawer *, .modal *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').map(e => e.textContent.trim().slice(0, 40)).slice(0, 5);
    const wide = [...document.querySelectorAll('.card .tbl')].filter(t => t.getBoundingClientRect().right > t.closest('.card').getBoundingClientRect().right + 1).map(e => (e.closest('.card')?.querySelector('h3')?.textContent || 'card').slice(0, 40));
    clipped.push(...wide.map(w => 'WIDE: ' + w));
    const route = location.hash;
    return { h, hscroll, clipped, route };
  })()`);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: Math.min(info.h, 4000), deviceScaleFactor: 1, mobile: false });
  await ev(`document.querySelector('.app') && (document.querySelector('.app').style.height = 'auto', document.querySelector('.main').style.overflow = 'visible'); true`);
  await wait(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, `${name}-${W}${process.env.PICK ? '-picked' : ''}.png`), Buffer.from(shot.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  if (process.env.CLICK) {
    const r = await ev(`(async () => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(process.env.CLICK)}); if (!b) return null; b.click(); await new Promise(r => setTimeout(r, 600)); return location.hash + (document.querySelector('.modal') ? '  [modal: ' + (document.querySelector('.modal [aria-checked=true]')?.textContent || '?') + ']' : '  [no modal]'); })()`);
    if (r) console.log(`   CLICK ${process.env.CLICK} -> ${r}`);
  }
  console.log(`${name.padEnd(26)} ${info.route.padEnd(70)} ${info.hscroll ? 'H-SCROLL ' : ''}${info.clipped.length ? 'CLIPPED ' + JSON.stringify(info.clipped) + ' ' : ''}${errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'ok'}`);
}
chrome.kill(); process.exit(0);
