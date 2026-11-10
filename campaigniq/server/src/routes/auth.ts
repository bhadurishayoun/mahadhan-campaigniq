import type { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/knex';
import { h, unauthorized } from '../http/errors';
import { signToken, authenticate } from '../http/auth';

export const path = '/auth';
export const isPublic = true;

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default function (router: Router) {
  router.post(
    '/login',
    h(async (req, res) => {
      const { email, password } = loginSchema.parse(req.body);
      const row = await db('user').where({ email: email.toLowerCase(), active: true }).first();
      if (!row || !(await bcrypt.compare(password, row.password_hash))) {
        throw unauthorized('Wrong email or password');
      }
      const user = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        title: row.title,
        geo_scope_id: row.geo_scope_id,
      };
      res.json({ token: signToken(user), user });
    }),
  );

  router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
}
