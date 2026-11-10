// Clean the datta07 district + sub-district files before simplification.
//  - drop 28 unnamed sliver features (each < 10 km2, no state / district)
//  - keep the "GUJARAT and DNH & DD ISLANDS" offshore feature only for the state / national outline (flag x=1)
//  - readable names: "CHHATRAPATI SAMBHAJINAGAR" -> "Chhatrapati Sambhajinagar"
//  - keep only Jalna's 8 talukas from the sub-district file
// usage: node prep.mjs <rawDir> <outDir>
import fs from 'node:fs';

const [RAW, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const SMALL = new Set(['and', 'of', 'the']);
const title = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/\s+/g, ' ').trim()
  .split(' ').map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-(./])([a-z])/g, (m, p, c) => p + c.toUpperCase()))).join(' ');
const STATE_FIX = { 'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu' };

const src = JSON.parse(fs.readFileSync(`${RAW}/datta-districts.geojson`, 'utf8'));
const subAll = JSON.parse(fs.readFileSync(`${RAW}/datta-subdistricts.geojson`, 'utf8')).features;

// --- repair corrupted district names (encoding damage in the source: "ū" -> "#", names truncated) --------
// A name is suspect if it contains non-name characters or is <= 5 letters and not a known short name.
const SHORT_OK = new Set(['Pali', 'Kota', 'Tonk', 'Bundi', 'Sikar', 'Churu', 'Dausa', 'Deeg', 'Leh', 'Kargil', 'Mandi', 'Una', 'Durg', 'Gaya', 'Mau', 'Agra', 'Puri', 'Mahe', 'Yanam', 'Diu', 'Daman', 'Goa', 'Kolar', 'Udupi', 'Gadag', 'Mandya', 'Akola', 'Beed', 'Latur', 'Pune', 'Thane', 'Dhule', 'Jalna', 'Sonbhadra', 'Etah', 'Banda', 'Rewa', 'Sidhi', 'Datia', 'Guna', 'Harda', 'Betul', 'Dewas', 'Dhar', 'Morena', 'Bhind', 'Seoni', 'Sagar', 'Katni', 'Satna', 'Panna', 'Damoh', 'Mungeli', 'Korba', 'Bastar', 'Kanker', 'Sukma', 'Arwal', 'Siwan', 'Saran', 'Buxar', 'Banka', 'Jamui', 'Araria', 'Supaul', 'Gumla', 'Khunti', 'Simdega', 'Pakur', 'Dumka', 'Godda', 'Latehar', 'Garhwa', 'Palamu', 'Ranchi', 'Bokaro', 'Angul', 'Boudh', 'Cuttack', 'Gajapati', 'Ganjam', 'Khordha', 'Koraput', 'Nuapada', 'Nayagarh', 'Kutch', 'Anand', 'Dahod', 'Surat', 'Tapi', 'Botad', 'Dang', 'Patan', 'Kheda', 'Navsari', 'Valsad', 'Morbi', 'Jind', 'Karnal', 'Nuh', 'Palwal', 'Rewari', 'Sirsa', 'Hisar', 'Moga', 'Mansa', 'Kullu', 'Chamba', 'Solan', 'Shimla', 'Kangra', 'Hamirpur', 'Bilaspur', 'Kinnaur', 'Theni', 'Salem', 'Karur', 'Ariyalur', 'Erode', 'Madurai', 'Vellore', 'Ranipet', 'Tenkasi', 'Nilgiris', 'Idukki', 'Kollam', 'Wayanad', 'Ernakulam', 'Medak', 'Jangaon', 'Nalgonda', 'Mulugu', 'Nirmal', 'Adilabad', 'Siddipet', 'Wanaparthy', 'Mon', 'Wokha', 'Zunheboto', 'Phek', 'Peren', 'Tuensang', 'Kohima', 'Dimapur', 'Longleng', 'Kiphire', 'Noklak', 'Mokokchung', 'Ukhrul', 'Tamenglong', 'Senapati', 'Thoubal', 'Kakching', 'Jiribam', 'Noney', 'Pherzawl', 'Kamjong', 'Aizawl', 'Lunglei', 'Mamit', 'Kolasib', 'Saitual', 'Serchhip', 'Hnahthial', 'Khawzawl', 'Champhai', 'Siaha', 'Lawngtlai', 'Gomati', 'Sepahijala', 'Unakoti', 'Dhalai', 'Khowai', 'Goalpara', 'Dhubri', 'Bajali', 'Majuli', 'Nagaon', 'Jorhat', 'Hojai', 'Baksa', 'Udalguri', 'Cachar', 'Tawang', 'Anjaw', 'Siang', 'Kamle', 'Pakke', 'Lohit', 'Changlang', 'Tirap', 'Longding', 'Namsai', 'Leparada', 'Shi Yomi', 'Kra Daadi', 'Kurung Kumey', 'Doda', 'Samba', 'Jammu', 'Kathua', 'Reasi', 'Ramban', 'Punch', 'Kulgam', 'Mirpur', 'Badgam', 'Gangtok', 'Pakyong', 'Soreng', 'Namchi', 'Gyalshing', 'Mangan', 'Malda', 'Nadia', 'Howrah', 'Hooghly', 'Bankura', 'Jhargram', 'Kalimpong', 'Darjeeling', 'Kolkata', 'Wardha', 'Washim', 'Nagpur', 'Satara', 'Sangli', 'Raigarh', 'Hingoli', 'Gondia', 'Nanded', 'Mumbai', 'Bhandara', 'Palghar', 'Nashik', 'Solapur', 'Unnao', 'Kheri', 'Bahraich', 'Balrampur', 'Gonda', 'Basti', 'Deoria', 'Ballia', 'Ghazipur', 'Jaunpur', 'Mirzapur', 'Jhansi', 'Lalitpur', 'Jalaun', 'Mahoba', 'Hapur', 'Meerut', 'Shamli', 'Bareilly', 'Budaun', 'Rampur', 'Amroha', 'Kannauj', 'Etawah', 'Auraiya', 'Hardoi', 'Sitapur', 'Lucknow', 'Amethi', 'Kaushambi', 'Chandauli', 'Varanasi', 'Bhadohi', 'Maharajganj', 'Kushinagar', 'Azamgarh', 'Almora', 'Champawat', 'Bageshwar', 'Nainital', 'Haridwar', 'Dehradun', 'Tehri Garhwal', 'Pauri Garhwal', 'Chamoli', 'Rudraprayag', 'Uttarkashi', 'Pithoragarh', 'Udham Singh Nagar']);
// Damage seen in the source: diacritic vowels replaced by # \ > | @ (e.g. ">NJ>W" = Anjaw, "B|RBH@M" = Birbhum),
// and Karnataka names truncated after the first diacritic ("B", "Ch", "H", "Y" ...). Nothing else is touched.
const DAMAGED = /[#\\>|@]/;
const suspect = (name, state) => DAMAGED.test(name) || (state === 'KARNATAKA' && name.replace(/[^A-Za-z]/g, '').length <= 5 && !SHORT_OK.has(title(name)));
const charFix = (name) => title(name.replace(/[#@]/g, 'u').replace(/>/g, 'a').replace(/[|\\]/g, 'i'));
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const inGeom = (lon, lat, g) => polys(g).some((rings) => rings.reduce((acc, ring) => acc !== inRing(lon, lat, ring), false));
// an interior sample point for a sub-district: the vertex-average of its largest ring, nudged until inside
const samplePoint = (g) => {
  const ring = polys(g).map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length; const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  if (inGeom(cx, cy, g)) return [cx, cy];
  return ring[Math.floor(ring.length / 2)].map((v, i) => v * 0.98 + (i ? cy : cx) * 0.02);
};
// The census sub-district file carries clean 2011 district names (dtname); for a suspect district we take the
// dtname that most of its sub-districts belong to.
const repairName = (f) => {
  const votes = {};
  for (const sd of subAll) {
    if (sd.properties.stname.toUpperCase() !== String(f.properties.state).toUpperCase()) continue;
    const [x, y] = samplePoint(sd.geometry);
    if (inGeom(x, y, f.geometry)) votes[sd.properties.dtname] = (votes[sd.properties.dtname] || 0) + 1;
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
};
// 2011 census spellings -> current official district names (Karnataka renames 2014; Bengaluru districts)
const CURRENT_NAME = {
  Bangalore: 'Bengaluru Urban', 'Bangalore Rural': 'Bengaluru Rural', Bagalkot: 'Bagalkote', Bellary: 'Ballari', Belgaum: 'Belagavi',
  Bijapur: 'Vijayapura', Chamrajnagar: 'Chamarajanagar', Chikkaballapura: 'Chikkaballapura', Chikmagalur: 'Chikkamagaluru',
  Gulbarga: 'Kalaburagi', Mysore: 'Mysuru', Shimoga: 'Shivamogga', Tumkur: 'Tumakuru', Davanagere: 'Davanagere', Ramanagara: 'Ramanagara',
};
const HASH_FIX = {
  'Bengal#ru (Rural)': 'Bengaluru Rural', 'Bengal#ru (Urban)': 'Bengaluru Urban', 'Chikkamagal#ru': 'Chikkamagaluru', 'Raich#r': 'Raichur',
  'Mys#ru': 'Mysuru', 'Tumak#ru': 'Tumakuru', 'B\\dar': 'Bidar', 'H>ORA': 'Howrah', 'M>LDAH': 'Malda',
};
// Karnataka names recovered from the sub-district file use current official spellings
Object.assign(CURRENT_NAME, { Bagalkot: 'Bagalkot', Chamrajnagar: 'Chamarajanagar', Chamarajanagara: 'Chamarajanagar' });

const out = [];
const repaired = [];
let dropped = 0;
for (const f of src.features) {
  const p = f.properties;
  if (!p.state || !f.geometry) { dropped += 1; continue; }
  const island = /GUJARAT and/i.test(p.state);
  const s = island ? 'Gujarat' : (STATE_FIX[title(p.state)] ?? title(p.state));
  let d = island ? 'Offshore islands' : title(p.district);
  if (!island && suspect(p.district, p.state)) {
    const fixed = HASH_FIX[p.district]
      ?? (DAMAGED.test(p.district) ? charFix(p.district) : (() => { const r = repairName(f); return r ? (CURRENT_NAME[r] ?? title(r)) : null; })());
    repaired.push(`${s}: "${p.district}" -> ${fixed ?? '?? (unresolved)'} [${Math.round(Number(p.shape_area) / 1e6)} km2]`);
    if (fixed) d = fixed;
  }
  out.push({ type: 'Feature', properties: { d, s, x: island ? 1 : 0, a: Math.round(Number(p.shape_area) / 1e6) }, geometry: f.geometry });
}
console.log(`repaired names (${repaired.length}):\n  ${repaired.join('\n  ')}`);
// formatting leftovers: "Medchal_malkajgiri" -> "Medchal-Malkajgiri", "South 24parganas" -> "South 24 Parganas"
for (const f of out) {
  f.properties.d = f.properties.d.replace(/_/g, '-').replace(/-([a-z])/g, (m, c) => `-${c.toUpperCase()}`).replace(/(\d+)([a-z])/gi, (m, n, c) => `${n} ${c.toUpperCase()}`);
}
// merge features that share a state + district name (the source stores a few fragments separately)
{
  const byKey = new Map();
  for (const f of out) {
    const k = `${f.properties.s}|${f.properties.d}`;
    const prev = byKey.get(k);
    if (!prev) { byKey.set(k, f); continue; }
    const coords = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
    prev.geometry = { type: 'MultiPolygon', coordinates: [...coords(prev.geometry), ...coords(f.geometry)] };
    prev.properties.a += f.properties.a;
    console.log(`merged fragment into ${k}`);
  }
  out.length = 0;
  out.push(...byKey.values());
}
const odd = out.filter((f) => /[^A-Za-z .()'&-]/.test(f.properties.d)).map((f) => `${f.properties.s}: ${f.properties.d}`);
console.log('names still containing unusual characters:', odd.join(' | ') || 'none');
const dupes = out.map((f) => `${f.properties.s}|${f.properties.d}`).filter((k, i, a) => a.indexOf(k) !== i);
console.log('duplicate names within a state:', dupes.join(', ') || 'none');
fs.writeFileSync(`${OUT}/districts-clean.geojson`, JSON.stringify({ type: 'FeatureCollection', features: out }));
console.log(`districts: kept ${out.length} (incl. 1 offshore-islands outline feature), dropped ${dropped} unnamed slivers`);
const states = [...new Set(out.map((f) => f.properties.s))].sort();
console.log(`states/UTs: ${states.length}\n  ${states.join(' | ')}`);

const subs = JSON.parse(fs.readFileSync(`${RAW}/datta-subdistricts.geojson`, 'utf8')).features
  .filter((f) => f.properties.dtname === 'Jalna')
  .map((f) => ({ type: 'Feature', properties: { t: f.properties.sdtname === 'Jafferabad' ? 'Jafrabad' : f.properties.sdtname, d: 'Jalna', s: 'Maharashtra', lgd: f.properties.Subdt_LGD }, geometry: f.geometry }));
fs.writeFileSync(`${OUT}/jalna-talukas-clean.geojson`, JSON.stringify({ type: 'FeatureCollection', features: subs }));
console.log(`Jalna talukas: ${subs.map((f) => f.properties.t).join(', ')}`);
