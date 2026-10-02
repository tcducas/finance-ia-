import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import { createUserClient } from '../lib/supabase.js';
import { getEntitlements } from '../middlewares/attachPlan.js';
import { getAuth } from '../middlewares/requireAuth.js';
import {
  holdingCreateSchema,
  holdingImportSchema,
  holdingUpdateSchema,
  panoramaQuerySchema,
} from '../schemas/holding.js';
import { idParamSchema } from '../schemas/transaction.js';
import type { RiskProfile } from '../lib/riskScore.js';
import * as portfolioService from '../services/portfolioService.js';
import type { UserClient } from '../lib/supabase.js';

/** Perfil de investidor do usuário; sem onboarding assumimos moderado. */
async function riskProfileOf(db: UserClient, userId: string): Promise<RiskProfile> {
  const { data, error } = await db
    .from('investor_profiles')
    .select('risk_profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  return data?.risk_profile ?? 'moderado';
}

/**
 * Posições em mercado fora do plano travariam o panorama inteiro, então
 * recusamos na entrada com a mensagem do mercado específico.
 */
function assertMarketsAllowed(req: Request, markets: string[]): void {
  const allowed = getEntitlements(req).markets as string[];
  const blocked = [...new Set(markets)].filter((m) => !allowed.includes(m));
  if (blocked.length > 0) {
    throw new AppError(
      `Sua carteira tem posições em ${blocked.join(', ')}, que faz parte do plano Pro.`,
      'PLAN_REQUIRED',
      402,
    );
  }
}

export async function list(req: Request, res: Response) {
  const db = createUserClient(getAuth(req).token);
  res.json({ data: await portfolioService.listHoldings(db) });
}

export async function create(req: Request, res: Response) {
  const input = holdingCreateSchema.parse(req.body);
  assertMarketsAllowed(req, [input.market]);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  res.status(201).json({ data: await portfolioService.createHolding(db, auth.userId, input) });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = holdingUpdateSchema.parse(req.body);
  if (input.market) assertMarketsAllowed(req, [input.market]);
  const db = createUserClient(getAuth(req).token);
  res.json({ data: await portfolioService.updateHolding(db, id, input) });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await portfolioService.deleteHolding(db, id);
  res.json({ data: { id } });
}

export async function importHoldings(req: Request, res: Response) {
  const { rows } = holdingImportSchema.parse(req.body);
  assertMarketsAllowed(req, rows.map((row) => row.market));
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  res.status(201).json({ data: await portfolioService.importHoldings(db, auth.userId, rows) });
}

/** GET /api/portfolio/panorama?rate= — números da análise de investimentos. */
export async function panorama(req: Request, res: Response) {
  const { rate } = panoramaQuerySchema.parse(req.query);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);

  const holdings = await portfolioService.listHoldings(db);
  assertMarketsAllowed(req, holdings.map((h) => h.market));

  const profile = await riskProfileOf(db, auth.userId);
  const data = await portfolioService.getPanorama(db, profile, rate);
  res.json({ data });
}
