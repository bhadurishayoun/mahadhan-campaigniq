import data from './places.json';

/** A real place named in the tool, at its verified coordinates (see places.json "about"). */
export interface Place {
  id: string;
  name: string;
  kind: 'district-hq' | 'taluka-hq' | 'village';
  lat: number;
  lon: number;
  /** district / state / taluka polygons the point lies in (verified by point-in-polygon) */
  district: string;
  state: string;
  taluka?: string;
  /** coordinate source, e.g. "geonames:1278871" or "osm:node/3605008530" */
  ref: string;
  /** caveat shown in the tooltip, e.g. when the tool's village name had to be matched to a nearby village */
  note?: string;
}

export const PLACES: Record<string, Place> = Object.fromEntries((data.places as Place[]).map((place) => [place.id, place]));

export function place(id: string): Place {
  const found = PLACES[id];
  if (!found) throw new Error(`Unknown map place "${id}" - add it to src/map/places.json`);
  return found;
}
