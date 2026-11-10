# Map data

Boundary and place data for the India maps (`src/map/IndiaDistrictMap.tsx`). Files here are served as static
assets and fetched only when a screen with a map is opened.

| File | Contents | Size |
|---|---|---|
| `india-districts.topo.json` | 790 districts, 36 states / UTs (28 + 8), national outline - TopoJSON objects `districts` (`d` = district, `s` = state), `states`, `india` | ~650 KB (~180 KB gzipped) |
| `jalna-talukas.topo.json` | The 8 talukas (sub-districts) of Jalna district - objects `talukas` (`t`, `d`, `s`, `lgd`), `district` | ~5 KB |

## Sources

* **District and taluka boundaries:** [datta07/INDIAN-SHAPEFILES](https://github.com/datta07/INDIAN-SHAPEFILES)
  (MIT licence), files `INDIA/INDIA_DISTRICTS.geojson` and `INDIA/INDIAN_SUB_DISTRICTS.geojson`, downloaded
  2026-11-10. The district layer reflects boundaries as of **2023** (LGD-aligned): it includes the 2022 Andhra
  Pradesh reorganisation (26 districts), the 2023 Rajasthan districts (50), and renames such as Chhatrapati
  Sambhajinagar and Dharashiv. Talukas are Census 2011 sub-districts with LGD codes.
* **National boundary:** the external boundary of India as depicted by the Government of India / Survey of India
  - all of Jammu & Kashmir and Ladakh (including PoK, Gilgit-Baltistan and Aksai Chin) and Arunachal Pradesh -
  with the current Union Territories (Jammu & Kashmir and Ladakh as separate UTs since 2019; Dadra & Nagar
  Haveli and Daman & Diu merged in 2020). Checked against DataMeet's Survey-of-India outline
  (`datameet/maps/Country/india-soi.geojson`): both reach 37.09° N and 97.4° E.
* **Place coordinates** (`src/map/places.json`): [GeoNames](https://www.geonames.org/) (CC-BY 4.0) and
  [OpenStreetMap](https://www.openstreetmap.org/) via Nominatim (© OpenStreetMap contributors, ODbL).

## Known limitations

* **Rajasthan:** the source still shows the 2023 set of 50 districts. Rajasthan announced in December 2024 that
  9 of the 2023 districts (e.g. Dudu, Kekri, Shahpura, Jaipur Gramin, Jodhpur Gramin) would be merged back; no
  open boundary file with that change was available, so those districts still appear separately.
* District shapes are simplified for fast loading (3 % of vertices; 20 % inside Maharashtra, where the tool zooms
  in). Borders are accurate to a few hundred metres - fine for planning maps, not for cadastral use.

## Processing (reproducible - scripts in `web/scripts/map-data/`)

1. `prep.mjs` - drops 28 unnamed sliver features, repairs encoding damage in 61 district names in the source
   (e.g. `>NJ>W` -> Anjaw, truncated Karnataka names recovered from the sub-district file), merges a split
   Purba Medinipur fragment, keeps the Gujarat offshore-islands feature for the state / national outline only,
   and extracts Jalna's talukas.
2. mapshaper (`npx mapshaper@0.6.102`):
   ```
   mapshaper -i districts-clean.geojson name=districts \
     -simplify variable percentage="s === 'Maharashtra' ? '20%' : '3%'" weighted keep-shapes \
     -clean overlap-rule=min-area \
     -dissolve s target=districts + name=states \
     -dissolve target=districts + name=india \
     -filter 'x !== 1' target=districts -filter-fields d,s target=districts \
     -o india-districts.topo.json format=topojson target=districts,states,india quantization=100000
   mapshaper -i jalna-talukas-clean.geojson name=talukas -simplify 40% weighted keep-shapes -clean \
     -dissolve d target=talukas + name=district \
     -o jalna-talukas.topo.json format=topojson target=talukas,district quantization=100000
   ```
3. `geocode.mjs` / `osm-villages.mjs` - look up every place named on the maps and keep only candidates that fall
   inside the expected taluka / district polygon.
4. `verify-places.mjs` - re-checks every entry in `src/map/places.json` against the shipped TopoJSON
   (point-in-polygon). Current result: **25 / 25 places inside their stated district (and taluka)**.
