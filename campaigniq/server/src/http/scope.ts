import type { Knex } from 'knex';
import { db } from '../db/knex';
import type { AuthUser } from './auth';

// Row-level access by geography. A user sees geo units under their scope root;
// head office / admin (no scope) see everything. An MDO additionally sees only their own MUs.

export async function descendantGeoIds(rootId: number, k: Knex = db): Promise<number[]> {
  const all = await k('geo_unit').select('id', 'parent_id');
  const children = new Map<number, number[]>();
  for (const g of all) {
    if (g.parent_id == null) continue;
    (children.get(g.parent_id) ?? children.set(g.parent_id, []).get(g.parent_id)!).push(g.id);
  }
  const out: number[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

// Returns the MU ids the user may see, or null when unrestricted.
export async function visibleMuIds(user: AuthUser, k: Knex = db): Promise<number[] | null> {
  if (user.role === 'mdo') {
    const rows = await k('mu').where({ mdo_user_id: user.id }).select('id');
    return rows.map((r) => r.id);
  }
  if (user.geo_scope_id == null || user.role === 'admin' || user.role === 'head_office') return null;
  const ids = await descendantGeoIds(user.geo_scope_id, k);
  const rows = await k('mu').whereIn('geo_unit_id', ids).select('id');
  return rows.map((r) => r.id);
}

export async function canSeeMu(user: AuthUser, muId: number, k: Knex = db): Promise<boolean> {
  const ids = await visibleMuIds(user, k);
  return ids === null || ids.includes(muId);
}
