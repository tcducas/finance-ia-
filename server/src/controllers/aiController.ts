import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
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

function userDb(req: Request) {
  // Sem Supabase configurado a IA ainda funciona (stateless, contexto mínimo).
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  return createUserClient(getAuth(req).token);
}

export async function chat(req: Request, res: Response) {
  const input = chatSchema.parse(req.body);
  const auth = getAuth(req);
  const data = await aiService.chat({
    db: userDb(req),
    userId: auth.userId,
    message: input.message,
    screen: input.screen,
    conversationId: input.conversationId,
    history: input.history,
  });
  res.json({ data });
}

export async function analyze(req: Request, res: Response) {
  const input = analyzeSchema.parse(req.body);
  getAuth(req);
  const data = await aiService.analyze({
    db: userDb(req),
    aporte: input.aporte,
    profile: input.profile,
    screen: input.screen,
    assetTicker: input.assetTicker,
  });
  res.json({ data });
}
