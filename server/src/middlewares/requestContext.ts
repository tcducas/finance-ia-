import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Request-id (propagado via `X-Request-Id`, gerado se ausente) + log de acesso
 * sem PII: método, rota, status, duração, userId (quando autenticado). Nunca
 * loga query string, body ou headers — evita vazar dado de usuário no log.
 */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.route ? `${req.baseUrl}${req.route.path}` : req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.auth?.userId,
    });
  });

  next();
}
