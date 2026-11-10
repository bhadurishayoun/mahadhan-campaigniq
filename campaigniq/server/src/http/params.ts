import type { Request } from 'express';
import { z } from 'zod';
import { db } from '../db/knex';
import { descendantGeoIds } from './scope';

// The global scope bar: Season, Geography, Crop, Product Portfolio, Campaign Type.
// Every dashboard endpoint accepts these as query params.
export const scopeQuerySchema = z.object({
  season: z.coerce.number().int().optional(),
  crop: z.coerce.number().int().optional(),
  geo: z.coerce.number().int().optional(),
  product: z.coerce.number().int().optional(),
  portfolio: z.string().optional(), // product category, e.g. Croptek
  campaign_type: z.string().optional(),
});

export interface ScopeParams {
  season_id: number;
  crop_id: number | null;
  geo_id: number | null;
  product_id: number | null;
  portfolio: string | null;
  campaign_type: string | null;
  geo_ids: number[] | null; // geo + all descendants, null = no geography filter
}

export async function parseScope(req: Request): Promise<ScopeParams> {
  const q = scopeQuerySchema.parse(req.query);
  let seasonId = q.season;
  if (!seasonId) {
    const latest = await db('season').where({ active: true }).orderBy('start_date', 'desc').first();
    seasonId = latest?.id;
  }
  const geoId = q.geo ?? null;
  const geoRow = geoId ? await db('geo_unit').where({ id: geoId }).first() : null;
  const isCountry = geoRow?.level === 'country';
  return {
    season_id: seasonId!,
    crop_id: q.crop ?? null,
    geo_id: geoId,
    product_id: q.product ?? null,
    portfolio: q.portfolio && q.portfolio !== 'All' ? q.portfolio : null,
    campaign_type: q.campaign_type && q.campaign_type !== 'All' ? q.campaign_type : null,
    geo_ids: geoId && !isCountry ? await descendantGeoIds(geoId) : null,
  };
}
