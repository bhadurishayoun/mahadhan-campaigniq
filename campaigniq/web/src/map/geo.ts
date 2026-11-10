/**
 * Boundary data for the India maps (loaded on demand, cached for the session).
 *
 *  public/geo/india-districts.topo.json  - 790 districts, 36 states / UTs, national outline
 *  public/geo/jalna-talukas.topo.json    - the 8 talukas (sub-districts) of Jalna district
 *
 * Source: datta07/INDIAN-SHAPEFILES (MIT), district boundaries as of 2023 (LGD-aligned, incl. the 2022 Andhra
 * Pradesh and 2023 Rajasthan reorganisations), national boundary as depicted by the Government of India
 * (all of Jammu & Kashmir and Ladakh, incl. PoK and Aksai Chin; Arunachal Pradesh). Simplified with mapshaper
 * (3 % of vertices; 20 % in Maharashtra) and stored as TopoJSON. See public/geo/README.md.
 */
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiLineString, Geometry } from 'geojson';

export type DistrictProps = { d: string; s: string };
export type TalukaProps = { t: string; d: string; s: string; lgd: number };

export interface IndiaGeo {
  districts: Feature<Geometry, DistrictProps>[];
  states: Feature<Geometry, { s: string }>[];
  outline: FeatureCollection;
  /** internal state borders only (drawn once, thicker than district lines) */
  stateBorders: MultiLineString;
}
export interface TalukaGeo {
  talukas: Feature<Geometry, TalukaProps>[];
  borders: MultiLineString;
}

const url = (file: string) => `${import.meta.env.BASE_URL}geo/${file}`;
let indiaPromise: Promise<IndiaGeo> | null = null;
let talukaPromise: Promise<TalukaGeo> | null = null;

async function fetchTopo(file: string): Promise<Topology> {
  const res = await fetch(url(file));
  if (!res.ok) throw new Error(`Map data ${file}: HTTP ${res.status}`);
  return res.json();
}

export function loadIndia(): Promise<IndiaGeo> {
  indiaPromise ??= fetchTopo('india-districts.topo.json').then((topo) => {
    const o = topo.objects as Record<string, GeometryCollection>;
    return {
      districts: (feature(topo, o.districts) as FeatureCollection<Geometry, DistrictProps>).features,
      states: (feature(topo, o.states) as FeatureCollection<Geometry, { s: string }>).features,
      outline: feature(topo, o.india) as FeatureCollection,
      stateBorders: mesh(topo, o.states, (a, b) => a !== b),
    };
  }).catch((error) => { indiaPromise = null; throw error; });
  return indiaPromise;
}

export function loadJalnaTalukas(): Promise<TalukaGeo> {
  talukaPromise ??= fetchTopo('jalna-talukas.topo.json').then((topo) => {
    const o = topo.objects as Record<string, GeometryCollection>;
    return {
      talukas: (feature(topo, o.talukas) as FeatureCollection<Geometry, TalukaProps>).features,
      borders: mesh(topo, o.talukas, (a, b) => a !== b),
    };
  }).catch((error) => { talukaPromise = null; throw error; });
  return talukaPromise;
}
