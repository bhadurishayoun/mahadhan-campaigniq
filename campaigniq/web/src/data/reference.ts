/**
 * Reference (master) data: states → districts → talukas, products, crops, seasons, campaign types.
 *
 * Source of truth: server/data/reference/*.json, served by GET /api/reference.
 * The same JSON files are bundled here as an offline fallback, so the filter bar works even when
 * the API is down. Adding a state/district/product = edit the JSON (or PUT /api/reference/{kind}).
 */
import { useEffect, useState } from 'react';
import geography from '../../../server/data/reference/geography.json';
import productMaster from '../../../server/data/reference/products.json';
import masters from '../../../server/data/reference/masters.json';
import { api } from '../api';

export interface District { id: string; name: string; talukas?: string[]; has_data?: boolean }
export interface State { id: string; name: string; districts: District[] }
export interface Product { id: string; name: string; family?: string; pack_sizes_kg?: number[]; crops?: string[]; active?: boolean }
export interface NamedItem { id: string; name: string; current?: boolean }

export interface ReferenceData {
  states: State[];
  products: Product[];
  crops: NamedItem[];
  seasons: NamedItem[];
  campaign_types: NamedItem[];
}

export const BUNDLED_REFERENCE: ReferenceData = {
  states: geography.states,
  products: productMaster.products,
  crops: masters.crops,
  seasons: masters.seasons,
  campaign_types: masters.campaign_types,
};

export const ALL = { geography: 'India', district: 'All Districts', crop: 'All Crops', portfolio: 'All Products', campaignType: 'All' } as const;

/** Filter-bar values are display names; this is what the screens and the copilot receive. */
export interface Filters {
  season: string;
  geography: string;
  district: string;
  crop: string;
  portfolio: string;
  campaignType: string;
}

/** Dataset / copilot scope: master ids (undefined = no filter). */
export interface Scope {
  season?: string;
  state?: string;
  district?: string;
  crop?: string;
  product?: string;
  campaign_type?: string;
}

export function districtsOf(reference: ReferenceData, stateName: string): District[] {
  const states = stateName === ALL.geography ? reference.states : reference.states.filter((state) => state.name === stateName);
  return states.flatMap((state) => state.districts);
}

export function filterOptions(reference: ReferenceData, filters: Filters): Record<keyof Filters, string[]> {
  return {
    season: reference.seasons.map((item) => item.name),
    geography: [ALL.geography, ...reference.states.map((state) => state.name)],
    district: [ALL.district, ...districtsOf(reference, filters.geography).map((district) => district.name)],
    crop: [ALL.crop, ...reference.crops.map((item) => item.name)],
    portfolio: [ALL.portfolio, ...reference.products.filter((product) => product.active !== false).map((product) => product.name)],
    campaignType: [ALL.campaignType, ...reference.campaign_types.map((item) => item.name)],
  };
}

/** Keep filters consistent after the geography changes (a district must belong to the selected state). */
export function normalizeFilters(reference: ReferenceData, filters: Filters): Filters {
  const valid = districtsOf(reference, filters.geography).some((district) => district.name === filters.district);
  return valid ? filters : { ...filters, district: ALL.district };
}

const idOf = (items: { id: string; name: string }[], name: string) => items.find((item) => item.name === name)?.id;

export function scopeOf(reference: ReferenceData, filters: Filters): Scope {
  return {
    season: idOf(reference.seasons, filters.season),
    state: idOf(reference.states, filters.geography),
    district: idOf(districtsOf(reference, filters.geography), filters.district),
    crop: idOf(reference.crops, filters.crop),
    product: idOf(reference.products, filters.portfolio),
    campaign_type: idOf(reference.campaign_types, filters.campaignType),
  };
}

/** Loads masters from the API; falls back to the bundled copy (live = false) when the API is unreachable. */
export function useReference(): { reference: ReferenceData; live: boolean } {
  const [state, setState] = useState({ reference: BUNDLED_REFERENCE, live: false });
  useEffect(() => {
    let cancelled = false;
    api<ReferenceData>('/reference')
      .then((reference) => { if (!cancelled) setState({ reference, live: true }); })
      .catch(() => { /* keep bundled reference */ });
    return () => { cancelled = true; };
  }, []);
  return state;
}
