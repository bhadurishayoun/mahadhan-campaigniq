// Look up the Ambad-area villages in OpenStreetMap (Nominatim), bounded to Ambad taluka, then verify each
// result with point-in-polygon against the Ambad sub-district boundary. 1 request/second (Nominatim policy).
// usage: node osm-villages.mjs <rawDir> <out.json>
import fs from 'node:fs';

const [RAW, OUT] = process.argv.slice(2);
const subs = JSON.parse(fs.readFileSync(`${RAW}/datta-subdistricts.geojson`, 'utf8')).features;
const jalnaTalukas = subs.filter((f) => f.properties.dtname === 'Jalna');
const ambad = jalnaTalukas.find((f) => f.properties.sdtname === 'Ambad');

const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inGeom = (lon, lat, g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
  .some((rings) => rings.reduce((acc, ring) => acc !== inRing(lon, lat, ring), false));
const talukaOf = (lon, lat) => jalnaTalukas.find((f) => inGeom(lon, lat, f.geometry))?.properties.sdtname ?? null;

// bounding box of Ambad taluka (+ small margin) for the bounded search
let [w, s, e, n] = [180, 90, -180, -90];
for (const poly of (ambad.geometry.type === 'Polygon' ? [ambad.geometry.coordinates] : ambad.geometry.coordinates)) {
  for (const [x, y] of poly[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
}
const pad = 0.03;
const viewbox = [w - pad, n + pad, e + pad, s - pad].map((v) => v.toFixed(4)).join(',');
console.log('Ambad taluka viewbox:', viewbox);

const VILLAGES = [
  ['golegaon', 'Golegaon', ['Golegaon']],
  ['wadigaon', 'Wadi Gaon', ['Wadigaon', 'Wadi Godri', 'Wadigodri', 'Wadi']],
  ['dhanora', 'Dhanora', ['Dhanora']],
  ['shahagad', 'Shahagad', ['Shahagad', 'Shahgad']],
  ['rohilagad', 'Rohilagad', ['Rohilagad', 'Rohilgad']],
  ['tandulwadi', 'Tandulwadi', ['Tandulwadi']],
  ['pimpalgaon', 'Pimpalgaon', ['Pimpalgaon']],
  ['kingaon', 'Kingaon', ['Kingaon']],
  ['sukapuri', 'Sukapuri', ['Sukapuri', 'Sukhapuri']],
  ['gondi', 'Gondi', ['Gondi']],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'CampaignIQ-map-data-build/1.0 (one-off geocoding of 10 village names for an internal dashboard)';
const results = [];
for (const [id, name, queries] of VILLAGES) {
  const hits = [];
  for (const q of queries) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&viewbox=${viewbox}&bounded=1&countrycodes=in&limit=10&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
    const list = res.ok ? await res.json() : [];
    for (const h of list) {
      const lat = +h.lat; const lon = +h.lon;
      hits.push({ q, osm: `${h.osm_type}/${h.osm_id}`, display: h.display_name, type: `${h.category}/${h.type}`, lat, lon, taluka: talukaOf(lon, lat) });
    }
    await sleep(1100);
  }
  // unique by osm id; keep places (not roads / shops) inside Ambad taluka, prefer place=village/town/hamlet
  const uniq = [...new Map(hits.map((h) => [h.osm, h])).values()];
  const places = uniq.filter((h) => /^place\/|^boundary\/administrative/.test(h.type));
  const inAmbad = places.filter((h) => h.taluka === 'Ambad');
  const exact = inAmbad.filter((h) => h.display.split(',')[0].toLowerCase().replace(/\s+/g, '').startsWith(queries[0].toLowerCase().replace(/\s+/g, '')));
  const pick = exact[0] ?? inAmbad[0] ?? null;
  results.push({ id: `v-${id}`, name, pick, inAmbadCount: inAmbad.length, inAmbad: inAmbad.map((h) => `${h.display.split(',')[0]} ${h.type} (${h.lat.toFixed(4)},${h.lon.toFixed(4)})`), otherTaluka: places.filter((h) => h.taluka !== 'Ambad').map((h) => `${h.display.split(',')[0]} [${h.taluka}] (${h.lat.toFixed(4)},${h.lon.toFixed(4)})`) });
  console.log(`${pick ? 'OK  ' : 'MISS'} ${name.padEnd(11)} ${pick ? `${pick.lat.toFixed(4)},${pick.lon.toFixed(4)} ${pick.display.split(',').slice(0, 3).join(',')} [${pick.type} ${pick.osm}]` : ''} | in Ambad: ${inAmbad.length} | other talukas: ${results.at(-1).otherTaluka.join('; ') || '-'}`);
  if (inAmbad.length > 1) console.log('      candidates in Ambad:', results.at(-1).inAmbad.join(' ; '));
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
