/**
 * Zonal Manager data: Marathwada zone, crop nutrition portfolio, territory plans, themes, concepts,
 * business case, activity approvals and impact. Figures shared with BH and FSM are read from bh.ts / fsm.ts.
 */
import type { ZmTerritoryId } from '../routes';

export type ZmScope = 'zone' | ZmTerritoryId;

export const ZM_SCOPES: { id: ZmScope; label: string }[] = [
  { id: 'zone', label: 'Marathwada zone' },
  { id: 'ambad', label: 'Ambad' },
  { id: 'ghansawangi', label: 'Ghansawangi' },
  { id: 'badnapur', label: 'Badnapur' },
  { id: 'jafrabad', label: 'Jafrabad' },
  { id: 'bhokardan', label: 'Bhokardan' },
];

export const ZM_PORTFOLIOS = [{ id: 'crop-nutrition', label: 'Crop nutrition portfolio' }] as const;
export type ZmPortfolio = (typeof ZM_PORTFOLIOS)[number]['id'];
