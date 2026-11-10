// Geocode every place mentioned on the tool's maps from GeoNames (CC-BY 4.0) and verify each lies inside
// the expected taluka / district polygon from the datta07 boundary files.
// usage: node geocode.mjs <rawDir> <out.json>
import fs from 'node:fs';

const [RAW, OUT] = process.argv.slice(2);
const districts = JSON.parse(fs.readFileSync(`${RAW}/datta-districts.geojson`, 'utf8')).features.filter((f) => f.properties.state);
const subs = JSON.parse(fs.readFileSync(`${RAW}/datta-subdistricts.geojson`, 'utf8')).features;

// Planar even-odd point-in-polygon: independent of ring winding (some source rings are reversed).
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inGeom = (lon, lat, g) => {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.some((rings) => rings.reduce((acc, ring) => acc !== inRing(lon, lat, ring), false));
};
const districtAt = (lon, lat) => districts.find((f) => inGeom(lon, lat, f.geometry));
const talukaAt = (lon, lat) => subs.find((f) => inGeom(lon, lat, f.geometry));
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '');

// --- load GeoNames populated places (class P) and admin areas (class A) -------------------------------
const rows = fs.readFileSync(`${RAW}/geonames/IN.txt`, 'utf8').split('\n');
const gn = [];
for (const line of rows) {
  const c = line.split('\t');
  if (c.length < 15 || (c[6] !== 'P')) continue;
  const names = new Set([c[1], c[2], ...c[3].split(',')].filter(Boolean).map(norm));
  gn.push({ id: c[0], name: c[1], names, lat: +c[4], lon: +c[5], code: c[7], pop: +c[14] });
}
console.log('GeoNames populated places loaded:', gn.length);

// --- the places mentioned on the maps -------------------------------------------------------------------
// expect.taluka = sub-district (census 2011 name in the boundary file); expect.district = district name.
const TARGETS = [
  // district headquarters (S1.1, S2.1)
  { id: 'jalna', name: 'Jalna', kind: 'district', aliases: ['Jalna'], district: 'JALNA', taluka: 'Jalna' },
  { id: 'dhule', name: 'Dhule', kind: 'district', aliases: ['Dhule', 'Dhulia'], district: 'DHULE' },
  { id: 'nashik', name: 'Nashik', kind: 'district', aliases: ['Nashik', 'Nasik'], district: 'NASHIK' },
  { id: 'sangli', name: 'Sangli', kind: 'district', aliases: ['Sangli'], district: 'SANGLI' },
  { id: 'anantapur', name: 'Anantapur', kind: 'district', aliases: ['Anantapur', 'Anantapuram', 'Ananthapuramu', 'Anantapuramu'], district: /ANANTH?APUR/ },
  // Jalna taluka headquarters (S2.2)
  { id: 't-jalna', name: 'Jalna', kind: 'taluka', aliases: ['Jalna'], district: 'JALNA', taluka: 'Jalna' },
  { id: 't-ambad', name: 'Ambad', kind: 'taluka', aliases: ['Ambad'], district: 'JALNA', taluka: 'Ambad' },
  { id: 't-badnapur', name: 'Badnapur', kind: 'taluka', aliases: ['Badnapur'], district: 'JALNA', taluka: 'Badnapur' },
  { id: 't-bhokardan', name: 'Bhokardan', kind: 'taluka', aliases: ['Bhokardan'], district: 'JALNA', taluka: 'Bhokardan' },
  { id: 't-jafrabad', name: 'Jafrabad', kind: 'taluka', aliases: ['Jafrabad', 'Jafferabad', 'Jafarabad', 'Zafarabad'], district: 'JALNA', taluka: 'Jafferabad' },
  { id: 't-partur', name: 'Partur', kind: 'taluka', aliases: ['Partur'], district: 'JALNA', taluka: 'Partur' },
  { id: 't-ghansawangi', name: 'Ghansawangi', kind: 'taluka', aliases: ['Ghansawangi', 'Ghansavangi', 'Ghanasawangi'], district: 'JALNA', taluka: 'Ghansawangi' },
  { id: 't-mantha', name: 'Mantha', kind: 'taluka', aliases: ['Mantha'], district: 'JALNA', taluka: 'Mantha' },
  // villages around Ambad (S2.3, S2.4, S5.3) - expected in Ambad taluka, Jalna district
  ...[
    ['golegaon', 'Golegaon', ['Golegaon', 'Golegaon Bk', 'Golegaon Budruk']],
    ['wadigaon', 'Wadi Gaon', ['Wadigaon', 'Wadi Gaon', 'Wadgaon', 'Vadigaon', 'Wadi']],
    ['dhanora', 'Dhanora', ['Dhanora', 'Dhanoda']],
    ['shahagad', 'Shahagad', ['Shahagad', 'Shahgad']],
    ['rohilagad', 'Rohilagad', ['Rohilagad', 'Rohilgad', 'Rohilagarh']],
    ['jamkhed', 'Jamkhed', ['Jamkhed']],
    ['tandulwadi', 'Tandulwadi', ['Tandulwadi', 'Tandulwadi Bk']],
    ['pimpalgaon', 'Pimpalgaon', ['Pimpalgaon', 'Pimpalgaon Renukai', 'Pimpalgaon Bk', 'Pimpalgaon Kh']],
    ['kingaon', 'Kingaon', ['Kingaon', 'Kingaon Bk']],
    ['sukapuri', 'Sukapuri', ['Sukapuri', 'Sukhapuri']],
    ['gondi', 'Gondi', ['Gondi']],
  ].map(([id, name, aliases]) => ({ id: `v-${id}`, name, kind: 'village', aliases, district: 'JALNA', taluka: 'Ambad' })),
];

const matchDistrict = (expect, feat) => feat && (expect instanceof RegExp ? expect.test(feat.properties.district) : feat.properties.district === expect);
const ambad = gn.find((p) => p.names.has('ambad') && talukaAt(p.lon, p.lat)?.properties.sdtname === 'Ambad');
const dist2 = (a, b) => Math.hypot(a.lat - b.lat, (a.lon - b.lon) * Math.cos((a.lat * Math.PI) / 180)) * 111;

const results = [];
for (const t of TARGETS) {
  const keys = new Set(t.aliases.map(norm));
  const cands = gn.filter((p) => [...keys].some((k) => p.names.has(k)));
  const scored = cands.map((p) => {
    const d = districtAt(p.lon, p.lat);
    const s = talukaAt(p.lon, p.lat);
    return { ...p, district: d?.properties.district, state: d?.properties.state, taluka: s?.properties.sdtname, okD: matchDistrict(t.district, d), okT: !t.taluka || s?.properties.sdtname === t.taluka };
  });
  const good = scored.filter((p) => p.okD && p.okT);
  // Prefer the official seat for HQs (PPLA*), else larger population, else nearest to Ambad town for villages.
  good.sort((a, b) => (t.kind === 'village' && ambad ? dist2(a, ambad) - dist2(b, ambad) : (/PPLA/.test(b.code) - /PPLA/.test(a.code)) || b.pop - a.pop));
  const pick = good[0];
  const inDistrictOnly = scored.filter((p) => p.okD && !p.okT);
  results.push({
    ...t, district: String(t.district),
    found: !!pick,
    lat: pick?.lat, lon: pick?.lon, geonameid: pick?.id, gnName: pick?.name, gnCode: pick?.code,
    inDistrict: pick?.district, inState: pick?.state, inTaluka: pick?.taluka,
    kmFromAmbad: pick && ambad ? +dist2(pick, ambad).toFixed(1) : null,
    alternativesInTaluka: good.slice(1).map((p) => `${p.name} (${p.lat.toFixed(4)},${p.lon.toFixed(4)})`),
    sameNameElsewhereInDistrict: inDistrictOnly.map((p) => `${p.name} [${p.taluka}] (${p.lat.toFixed(4)},${p.lon.toFixed(4)})`),
    totalNameMatchesInIndia: cands.length,
  });
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
for (const r of results) {
  console.log(`${r.found ? 'OK  ' : 'MISS'} ${r.id.padEnd(14)} ${r.found ? `${r.lat.toFixed(4)},${r.lon.toFixed(4)} -> ${r.inDistrict} / ${r.inTaluka} / ${r.inState} [${r.gnName} ${r.gnCode} #${r.geonameid}]` : ''}`
    + `${r.alternativesInTaluka.length ? `  +${r.alternativesInTaluka.length} more in taluka` : ''}${r.sameNameElsewhereInDistrict.length ? `  (elsewhere in district: ${r.sameNameElsewhereInDistrict.join('; ')})` : ''}  [${r.totalNameMatchesInIndia} India-wide]`);
}
