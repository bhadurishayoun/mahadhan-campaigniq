import type { Knex } from 'knex';
import { db } from '../db/knex';
import { CONFIG_DEFAULTS } from '../config/defaults';

export type AppConfig = Record<string, any>;

// Reads the config table; falls back to defaults for keys that are not stored yet.
export async function getConfig(k: Knex = db): Promise<AppConfig> {
  const rows = await k('config').select('key', 'value');
  const out: AppConfig = {};
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) out[key] = def.value;
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

export async function setConfig(key: string, value: unknown, k: Knex = db) {
  const json = JSON.stringify(value);
  const exists = await k('config').where({ key }).first();
  if (exists) await k('config').where({ key }).update({ value: json });
  else await k('config').insert({ key, value: json, description: CONFIG_DEFAULTS[key]?.description ?? null });
}

// "Today" for the demo. Seeded data lives in Dec 2026 - Mar 2027, so config.today_override pins the date.
export function todayISO(cfg: AppConfig): string {
  const o = cfg.today_override;
  return typeof o === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o) ? o : new Date().toISOString().slice(0, 10);
}
