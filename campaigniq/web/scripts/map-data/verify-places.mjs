// For every place in web/src/map/places.json, check (d3.geoContains) that its lat/lon lies inside the stated
// district (and taluka, when given) in the exact TopoJSON files the app ships in web/public/geo.
// usage: node verify-places.mjs <webDir>
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const WEB = process.argv[2];
const topo = JSON.parse(fs.readFileSync(`${WEB}/public/geo/india-districts.topo.json`, 'utf8'));
const tal = JSON.parse(fs.readFileSync(`${WEB}/public/geo/jalna-talukas.topo.json`, 'utf8'));
const districts = feature(topo, topo.objects.districts).features;
const talukas = feature(tal, tal.objects.talukas).features;
const { places } = JSON.parse(fs.readFileSync(`${WEB}/src/map/places.json`, 'utf8'));

let fail = 0;
for (const p of places) {
  const pt = [p.lon, p.lat];
  const hits = districts.filter((f) => geoContains(f, pt));
  const d = hits[0]?.properties;
  const t = talukas.find((f) => geoContains(f, pt))?.properties.t;
  const okD = hits.length === 1 && d.d === p.district && d.s === p.state;
  const okT = !p.taluka || t === p.taluka;
  if (!okD || !okT) fail += 1;
  console.log(`${okD && okT ? 'PASS' : 'FAIL'}  ${p.name.padEnd(12)} (${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})  expected ${p.district}, ${p.state}${p.taluka ? ` / ${p.taluka}` : ''}  ->  found ${hits.map((h) => `${h.properties.d}, ${h.properties.s}`).join(' + ') || 'NONE'}${p.taluka ? ` / ${t ?? 'NONE'}` : ''}`);
}
console.log(`\n${places.length - fail}/${places.length} places inside their stated district${fail ? ` - ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
