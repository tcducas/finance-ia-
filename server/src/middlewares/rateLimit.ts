import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../env.js';

function skip(): boolean {
  return env.NODE_ENV === 'test' || env.RATE_LIMIT_DISABLED;
}

function tooMany(_req: Request, res: Response) {
  res
    .status(429)
    .json({ error: { message: 'Muitas requisições. Tente de novo em instantes.', code: 'RATE_LIMITED' } });
}

const shared = {
  standardHeaders: true as const,
  legacyHeaders: false,
  skip,
  handler: tooMany,
};

/** Teto global em /api — rede de segurança, não o limite fino de cada rota. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  ...shared,
});

/** /api/market é pública (sem requireAuth) — o alvo mais exposto do backend. */
export const marketLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  ...shared,
});

/** /api/ai roda depois do requireAuth — limita por usuário, não por IP. */
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  ...shared,
  keyGenerator: (req) => req.auth?.userId ?? ipKeyGenerator(req.ip ?? 'unknown'),
});
