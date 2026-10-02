import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import { AppError } from '../errors/AppError.js';
import { getPlan } from '../middlewares/attachPlan.js';
import * as aiUsageService from '../services/aiUsageService.js';
import * as portfolioService from '../services/portfolioService.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { RiskProfile } from '../lib/riskScore.js';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import * as aiService from '../services/aiService.js';

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Mensagem obrigatória').max(4000),
  conversationId: z.string().uuid().optional(),
  screen: z.string().trim().max(40).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(50)
    .optional(),
});

const analyzeSchema = z.object({
  aporte: z.number().finite().positive().optional(),
  profile: z.string().trim().max(40).optional(),
  screen: z.string().trim().max(40).optional(),
  assetTicker: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9^.]{1,12}$/)
    .optional(),
});

/**
 * Bloqueia quando a cota do plano free acabou. 402 PLAN_REQUIRED é o mesmo
 * status do gating de mercado, então o client já sabe abrir a tela de planos.
 */
async function assertQuota(req: Request, userId: string, kind: 'chat' | 'analyze') {
  const status = await aiUsageService.quotaStatus(userId, getPlan(req), kind);
  if (status.exceeded) {
    const janela = kind === 'chat' ? 'hoje' : 'neste mês';
    throw new AppError(
      `Você usou as ${status.limit} ${kind === 'chat' ? 'mensagens' : 'análises'} ${janela} do plano free. O plano Pro não tem limite.`,
      'PLAN_REQUIRED',
      402,
    );
  }
  return status;
}

function userDb(req: Request) {
  // Sem Supabase configurado a IA ainda funciona (stateless, contexto mínimo).
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  return createUserClient(getAuth(req).token);
}

export async function chat(req: Request, res: Response) {
  const input = chatSchema.parse(req.body);
  const auth = getAuth(req);
  await assertQuota(req, auth.userId, 'chat');
  const data = await aiService.chat({
    db: userDb(req),
    userId: auth.userId,
    message: input.message,
    screen: input.screen,
    conversationId: input.conversationId,
    history: input.history,
  });
  // Cobra só depois da resposta: falhar a chamada não deve gastar a cota.
  await aiUsageService.increment(auth.userId, 'chat');
  const quota = await aiUsageService.quotaStatus(auth.userId, getPlan(req), 'chat');
  res.json({ data: { ...data, quota } });
}

export async function analyze(req: Request, res: Response) {
  const input = analyzeSchema.parse(req.body);
  const auth = getAuth(req);
  await assertQuota(req, auth.userId, 'analyze');
  const data = await aiService.analyze({
    db: userDb(req),
    aporte: input.aporte,
    profile: input.profile,
    screen: input.screen,
    assetTicker: input.assetTicker,
  });
  await aiUsageService.increment(auth.userId, 'analyze');
  res.json({ data });
}

const reviewSchema = z.object({
  /** O que o usuário quer resolver — é o que a avaliação precisa responder. */
  objetivo: z.string().trim().min(5, 'Descreva o que você quer resolver').max(600),
  /** Taxa de atratividade do VPL, decimal ao ano. */
  rate: z.number().finite().min(0).max(1).optional(),
});

/**
 * POST /api/ai/portfolio — avaliação da carteira importada.
 *
 * O panorama é calculado aqui (motor puro + cotações) e só então entregue à IA,
 * que interpreta. Consome a cota de `analyze`: é uma chamada de análise.
 */
export async function reviewPortfolio(req: Request, res: Response) {
  const input = reviewSchema.parse(req.body);
  const auth = getAuth(req);
  await assertQuota(req, auth.userId, 'analyze');

  const db = createUserClient(auth.token);
  const holdings = await portfolioService.listHoldings(db);
  if (holdings.length === 0) {
    throw new AppError(
      'Importe ou cadastre sua carteira antes de pedir a avaliação.',
      'EMPTY_PORTFOLIO',
      400,
    );
  }

  const { data: investor, error } = await db
    .from('investor_profiles')
    .select('risk_profile')
    .eq('user_id', auth.userId)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  const profile: RiskProfile = investor?.risk_profile ?? 'moderado';

  const panorama = await portfolioService.getPanorama(db, profile, input.rate);
  const review = await aiService.reviewPortfolio({ panorama, objetivo: input.objetivo });

  await aiUsageService.increment(auth.userId, 'analyze');
  res.json({ data: { review, panorama } });
}
