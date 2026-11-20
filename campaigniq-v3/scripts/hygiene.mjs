// Hygiene check for the Business Head workspace (rules 1–4 and 6 of CLAUDE.md). Exits 1 on any hit.
// Scans src/ except tests, route constants and the sign-in page (copied unchanged from v2, exempt by instruction).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'src');
const EXEMPT = [/[\\/]auth[\\/]/, /\.test\.ts$/, /[\\/]routes\.ts$/];
const WORDS = ['illustrative', 'sample', 'demo', 'mock', 'synthetic', 'dummy', 'placeholder', 'lorem', 'tbd', 'v2',
  'ai', 'copilot', 'smart', 'intelligence', 'intelligent', 'insight', 'generated', 'powered by', 'magic', 'auto-suggest'];
const ICONS = ['Sparkles', 'Sparkle', 'WandSparkles', 'Wand2', 'Wand'];
const CODE = /\b(BH|MH|PM|TM|ZM|FSM)\.\d/;

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f) && !EXEMPT.some((r) => r.test(p))) files.push(p);
  }
})(root);

const hits = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const where = `${path.relative(root, f)}:${i + 1}`;
    // Strip comments and import lines; check visible strings and JSX text only.
    const line = raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    if (/^\s*(import|\*|\/\*)/.test(raw)) return;
    const text = [...line.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`|>([^<>{}]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]).join(' ');
    for (const w of WORDS) if (new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'i').test(text)) hits.push(`${where}  banned word "${w}"`);
    if (CODE.test(text)) hits.push(`${where}  screen code`);
    if (/Sources:|READ-ONLY/i.test(text)) hits.push(`${where}  sources / read-only label`);
    if (!f.endsWith('theme.ts') && /#[0-9a-fA-F]{3,8}\b/.test(line) && !/var\(--/.test(line)) hits.push(`${where}  hex colour outside theme.ts`);
    for (const ic of ICONS) if (new RegExp(`\\b${ic}\\b`).test(line)) hits.push(`${where}  banned icon ${ic}`);
    const fs1 = line.match(/font-?[sS]ize:\s*'?(\d+(?:\.\d+)?)/);
    if (fs1 && Number(fs1[1]) < 12) hits.push(`${where}  font size ${fs1[1]} < 12`);
  });
}

if (hits.length) {
  console.log(hits.join('\n'));
  console.log(`\n${hits.length} hygiene issue(s).`);
  process.exit(1);
}
console.log(`Hygiene OK — ${files.length} files, 0 issues.`);
