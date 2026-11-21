/** Field Sales Manager data (Jalna cluster). A drill-down of the Business Head data in `bh.ts`, never a separate set. */
import type { FsmTerritoryId } from '../routes';

export type FsmScope = 'cluster' | FsmTerritoryId;

export const FSM_SCOPES: { id: FsmScope; label: string }[] = [
  { id: 'cluster', label: 'Jalna cluster' },
  { id: 'ambad', label: 'Ambad' },
  { id: 'ghansawangi', label: 'Ghansawangi' },
  { id: 'badnapur', label: 'Badnapur' },
];

/** Activity opened from the control tower's exception list (first at-risk activity). */
export const AT_RISK_ACTIVITY = 'dhanora-field-demonstration';
