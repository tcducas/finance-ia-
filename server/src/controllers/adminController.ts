import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { PLANS } from '../lib/entitlements.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { idParamSchema } from '../schemas/transaction.js';
import * as adminService from '../services/adminService.js';

export async function stats(_req: Request, res: Response) {
  res.json({ data: await adminService.getStats() });
}

const listQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
});

export async function users(req: Request, res: Response) {
  const { q } = listQuerySchema.parse(req.query);
  res.json({ data: await adminService.listUsers(q) });
}

const planBodySchema = z.object({ plan: z.enum(PLANS) });

/** PATCH /api/admin/users/:id/plan — concede ou revoga o plano Pro. */
export async function setPlan(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { plan } = planBodySchema.parse(req.body);
  const auth = getAuth(req);

  // Rebaixar a si mesmo é quase sempre engano — e sem Pro o admin perderia a
  // visão das telas que ele precisa testar. Exigimos fazer isso pelo banco.
  if (id === auth.userId && plan === 'free') {
    throw new AppError(
      'Você não pode rebaixar o próprio plano pelo painel.',
      'FORBIDDEN',
      403,
    );
  }

  res.json({ data: await adminService.setUserPlan(id, plan) });
}
