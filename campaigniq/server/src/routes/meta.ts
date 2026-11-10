import type { Router } from 'express';
import { db } from '../db/knex';
import { h } from '../http/errors';
import { visibleMuIds } from '../http/scope';

export const path = '/meta';

interface GeoNode {
  id: number;
  name: string;
  level: string;
  code: string | null;
  parent_id: number | null;
  children: GeoNode[];
}

export default function (router: Router) {
  // Everything the global scope bar needs: seasons, crops, products, geography tree.
  router.get(
    '/filters',
    h(async (req, res) => {
      const [seasons, crops, products, geo, mus, hierarchy] = await Promise.all([
        db('season').where({ active: true }).orderBy('start_date', 'desc').select('id', 'name', 'start_date', 'end_date'),
        db('crop').where({ active: true }).orderBy('name').select('id', 'name', 'stage_anchor'),
        db('product').where({ active: true }).orderBy('name').select('id', 'name', 'category', 'pack_kg', 'price_per_pack', 'placeholder'),
        db('geo_unit').where({ active: true }).whereIn('level', ['country', 'state', 'district', 'mu']).select('id', 'name', 'level', 'code', 'parent_id'),
        db('mu').select('id', 'geo_unit_id', 'villages_count', 'mdo_count'),
        db('hierarchy_level').orderBy('level_no').select('level_no', 'name'),
      ]);
      const visible = await visibleMuIds(req.user!);
      const muByGeo = new Map(mus.map((m) => [m.geo_unit_id, m]));
      const nodes = new Map<number, GeoNode>();
      for (const g of geo) {
        if (g.level === 'mu' && visible && !visible.includes(muByGeo.get(g.id)?.id ?? -1)) continue;
        nodes.set(g.id, { ...g, children: [] });
      }
      const roots: GeoNode[] = [];
      for (const n of nodes.values()) {
        const parent = n.parent_id != null ? nodes.get(n.parent_id) : undefined;
        if (parent) parent.children.push(n);
        else roots.push(n);
      }
      const attachMu = (n: GeoNode): any => ({
        id: n.id,
        name: n.name,
        level: n.level,
        code: n.code,
        mu_id: muByGeo.get(n.id)?.id ?? null,
        children: n.children.map(attachMu),
      });
      const portfolios = [...new Set(products.map((p) => p.category))];
      res.json({
        seasons,
        crops,
        products,
        portfolios,
        campaign_types: ['Adoption', 'Awareness', 'Retention', 'Market development'],
        geography: roots.map(attachMu),
        hierarchy_levels: hierarchy,
        user: req.user,
      });
    }),
  );
}
