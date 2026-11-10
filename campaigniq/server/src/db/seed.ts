import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { db, seedsDir } from './knex';
import { migrateReset } from './migrate';

export interface SeedCtx {
  passwordHash: string;
  today: string;
}

// Seeds in src/db/seeds/*.ts run in filename order. Each exports: default async (db, ctx) => void.
// The seed resets the database first, so it is safe to run repeatedly.
export async function runSeeds(k: Knex = db, opts: { reset?: boolean } = { reset: true }) {
  if (opts.reset !== false) await migrateReset(k);
  const ctx: SeedCtx = {
    passwordHash: await bcrypt.hash('Demo@123', 8),
    today: '2027-01-27',
  };
  const files = fs.readdirSync(seedsDir).filter((f) => /^\d+.*\.ts$/.test(f)).sort();
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(seedsDir, f)).href);
    const t0 = Date.now();
    await mod.default(k, ctx);
    console.log(`  seeded ${f} (${Date.now() - t0} ms)`);
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  console.log('Seeding database with placeholder data...');
  runSeeds()
    .then(() => console.log('Done. Demo logins: strategy@mahadhan.demo / region@mahadhan.demo / jadhav@mahadhan.demo (password Demo@123)'))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => db.destroy());
}
