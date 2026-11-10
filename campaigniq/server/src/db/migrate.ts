import type { Knex } from 'knex';
import { db, migrationsDir } from './knex';

export async function migrateLatest(k: Knex = db) {
  return k.migrate.latest({ directory: migrationsDir, loadExtensions: ['.ts'] });
}

export async function migrateReset(k: Knex = db) {
  await k.migrate.rollback({ directory: migrationsDir, loadExtensions: ['.ts'] }, true);
  return migrateLatest(k);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrateLatest()
    .then(([batch, log]) => {
      console.log(`Migrated (batch ${batch}):`, log);
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => db.destroy());
}
