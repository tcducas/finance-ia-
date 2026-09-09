import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from './requireAuth.js';

/**
 * Roda depois de requireAuth. Lê a flag is_admin do próprio profile (via RLS)
 * e bloqueia quem não for admin. Nunca há e-mail de admin cravado no código.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const { data, error } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.userId)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data?.is_admin) {
    throw new AppError('Acesso restrito.', 'FORBIDDEN', 403);
  }
  next();
}
