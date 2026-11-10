import knexLib, { type Knex } from 'knex';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, '..', '..');

// SQLite for the demo. Set DATABASE_URL (and `npm i pg -w server`) to run on PostgreSQL:
// all queries go through knex so no SQLite-specific SQL is used.
export function createDb(filename?: string): Knex {
  const url = process.env.DATABASE_URL;
  if (url) {
    return knexLib({ client: 'pg', connection: url, pool: { min: 1, max: 10 } });
  }
  const file = filename ?? process.env.DB_FILE ?? path.join(serverRoot, 'data', 'campaigniq.db');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  return knexLib({
    client: 'better-sqlite3',
    connection: { filename: file },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: { pragma: (s: string) => void }, done: (e: Error | null, c: unknown) => void) => {
        conn.pragma('foreign_keys = ON');
        conn.pragma('journal_mode = WAL');
        done(null, conn);
      },
    },
  });
}

export const db: Knex = createDb();

export const migrationsDir = path.join(here, 'migrations');
export const seedsDir = path.join(here, 'seeds');
