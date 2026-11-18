import type { Filters } from '../data/reference';

export interface MarketPulseRow {
  region: string;
  states: string[];
  market: string;
  crop: string;
  product: string;
  gap: string;
  points: string;
  tone?: string;
}

export const MARKET_PULSE: MarketPulseRow[] = [
  { region: 'West Region', states: ['Maharashtra'], market: 'High', crop: 'Onion', product: 'Croptek', gap: 'High potential – under-indexing', points: '0,24 12,19 24,21 36,12 48,16 60,6 72,4', tone: 'priority' },
  { region: 'South Region', states: ['Karnataka', 'Telangana', 'Andhra Pradesh'], market: 'High', crop: 'Maize', product: 'Croptek', gap: 'Strong momentum – scale further', points: '0,22 12,16 24,18 36,11 48,14 60,8 72,5' },
  { region: 'North Region', states: [], market: 'Medium–High', crop: 'Cotton', product: 'Croptek', gap: 'Stable – improve penetration', points: '0,18 12,16 24,18 36,14 48,15 60,11 72,9' },
  { region: 'East Region', states: [], market: 'Medium', crop: 'Soybean', product: 'Croptek', gap: 'Emerging – expansion opportunity', points: '0,23 12,20 24,18 36,13 48,14 60,7 72,3' },
];

export function marketPulseForFilters(rows: MarketPulseRow[], filters: Filters, scope: 'National' | 'Regional', region: string) {
  return rows.filter((row) => {
    if (scope === 'Regional' && region !== 'All Regions' && row.region !== region) return false;
    if (filters.geography !== 'India' && (row.states.length !== 1 || row.states[0] !== filters.geography)) return false;
    if (filters.crop !== 'All Crops' && row.crop.toLowerCase() !== filters.crop.toLowerCase()) return false;
    if (filters.portfolio !== 'All Products' && row.product.toLowerCase() !== filters.portfolio.toLowerCase()) return false;
    return true;
  });
}

export const FILTERED_DEMO_CROP = 'Onion';
export const FILTERED_DEMO_PRODUCT = 'Croptek';
export const FILTERED_DEMO_REGION = 'West Region';
