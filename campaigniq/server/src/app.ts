import express, { Router } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { authenticate } from './http/auth';
import { errorMiddleware } from './http/errors';

const here = path.dirname(fileURLToPath(import.meta.url));

// Route modules in src/routes/*.ts are auto-registered. A module exports:
//   export const path = '/plans';           (optional, mounted under /api)
//   export const isPublic = true;            (optional, skip authentication)
//   export default function (router: Router) { ... }
export async function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'campaigniq-api' }));

  const routesDir = path.join(here, 'routes');
  const files = fs
    .readdirSync(routesDir)
    .filter((f) => /\.(ts|js)$/.test(f) && !f.endsWith('.d.ts'))
    .sort();

  const publicRouter = Router();
  const privateRouter = Router();
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(routesDir, f)).href);
    const router = Router();
    mod.default(router);
    const mount = mod.path ?? '/';
    (mod.isPublic ? publicRouter : privateRouter).use(mount, router);
  }

  app.use('/api', publicRouter);
  app.use('/api', authenticate, privateRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));
  app.use(errorMiddleware);
  return app;
}
