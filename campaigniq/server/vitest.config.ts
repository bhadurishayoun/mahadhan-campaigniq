import { defineConfig } from 'vitest/config';
import path from 'node:path';
import os from 'node:os';

export default defineConfig({
  test: {
    env: { DB_FILE: path.join(os.tmpdir(), `campaigniq-test-${process.pid}.db`), JWT_SECRET: 'test-secret' },
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
