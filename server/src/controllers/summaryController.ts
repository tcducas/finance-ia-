import type { Request, Response } from 'express';
import { currentMonth, monthRange } from '../lib/period.js';
import { clampEvolutionMonths } from '../lib/entitlements.js';
import { createUserClient } from '../lib/supabase.js';
import { getPlan } from '../middlewares/attachPlan.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { evolutionQuerySchema, periodQuerySchema } from '../schemas/transaction.js';
import * as evolutionService from '../services/evolutionService.js';
import * as summaryService from '../services/summaryService.js';

export async function summary(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await summaryService.getPeriodSummary(db, monthRange(month ?? currentMonth()));
  res.json({ data });
}

export async function spending(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await summaryService.getSpendingByCategory(db, monthRange(month ?? currentMonth()));
  res.json({ data });
}

/** GET /api/summary/evolution?month=&months= — série do gráfico de evolução. */
export async function evolution(req: Request, res: Response) {
  const { month, months } = evolutionQuerySchema.parse(req.query);
  const plan = getPlan(req);
  // Janela maior que o teto do plano é recortada, não recusada: o gráfico abre
  // com o histórico permitido em vez de devolver erro.
  const allowed = clampEvolutionMonths(plan, months);
  const db = createUserClient(getAuth(req).token);
  const data = await evolutionService.getEvolution(db, month ?? currentMonth(), allowed);
  res.json({ data: { ...data, months: allowed, requestedMonths: months, plan } });
}

/** POST /api/summary/snapshot — grava a foto do patrimônio do mês (idempotente). */
export async function snapshot(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.body ?? {});
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await evolutionService.saveSnapshot(db, auth.userId, month ?? currentMonth());
  res.status(201).json({ data });
}
