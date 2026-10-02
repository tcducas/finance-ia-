import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import { entitlementsFor, planFrom, type Entitlements, type Plan } from '../lib/entitlements.js';
import { createUserClient } from '../lib/supabase.js';
import { verifyBearer } from './requireAuth.js';

declare global {
  namespace Express {
    interface Request {
      plan?: Plan;
      entitlements?: Entitlements;
    }
  }
}

/**
 * Lê o plano do usuário e anexa { plan, entitlements } à requisição.
 *
 * Autenticação OPCIONAL: as rotas de mercado são públicas (não expõem dado de
 * usuário) e precisam continuar funcionando sem token, só com os limites do
 * plano free. Token ausente ou inválido = free, nunca 401 — quem precisa de
 * sessão é o requireAuth, não este middleware.
 */
export async function attachPlan(req: Request, _res: Response, next: NextFunction) {
  req.plan = 'free';
  req.entitlements = entitlementsFor('free');

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const auth = await verifyBearer(header.slice('Bearer '.length)).catch(() => null);
  if (!auth) return next();

  req.auth = auth;
  const db = createUserClient(auth.token);
  const { data, error } = await db
    .from('profiles')
    .select('plan')
    .eq('id', auth.userId)
    .maybeSingle();
  // Falha de leitura não derruba uma rota pública: o usuário segue como free.
  if (error) throw fromPostgrest(error);

  const plan = planFrom(data?.plan);
  req.plan = plan;
  req.entitlements = entitlementsFor(plan);
  next();
}

/** Plano já resolvido pelo attachPlan (ou free, quando ele não rodou). */
export function getPlan(req: Request): Plan {
  return req.plan ?? 'free';
}

export function getEntitlements(req: Request): Entitlements {
  return req.entitlements ?? entitlementsFor('free');
}

/**
 * Guarda de rota que exige um plano. Roda depois de requireAuth + attachPlan.
 * Responde 402 com código PLAN_REQUIRED — status próprio para o client abrir a
 * tela de planos em vez de tratar como erro de permissão.
 */
export function requirePlan(required: Plan) {
  return function planGuard(req: Request, _res: Response, next: NextFunction) {
    if (getPlan(req) !== required) {
      throw new AppError(
        `Este recurso faz parte do plano ${required}.`,
        'PLAN_REQUIRED',
        402,
      );
    }
    next();
  };
}
