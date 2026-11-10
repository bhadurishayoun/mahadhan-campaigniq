import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/knex';
import { forbidden, unauthorized } from './errors';

export type Role = 'admin' | 'head_office' | 'zone' | 'region_manager' | 'mdo' | 'call_centre';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  geo_scope_id: number | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

export const signToken = (u: AuthUser) =>
  jwt.sign({ sub: String(u.id) }, SECRET, { expiresIn: '12h' });

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const raw = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!raw) throw unauthorized();
    const payload = jwt.verify(raw, SECRET) as unknown as { sub: string };
    const row = await db('user').where({ id: Number(payload.sub), active: true }).first();
    if (!row) throw unauthorized();
    req.user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      title: row.title,
      geo_scope_id: row.geo_scope_id,
    };
    next();
  } catch (e) {
    next(e instanceof Error && e.name === 'JsonWebTokenError' ? unauthorized('Invalid session') : e);
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

// Roles that may approve a plan: region manager and above.
export const APPROVER_ROLES: Role[] = ['region_manager', 'zone', 'head_office', 'admin'];
