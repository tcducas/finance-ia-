import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const path = issue?.path.join('.') ?? '';
    const message = issue ? `${path ? `${path}: ` : ''}${issue.message}` : 'Entrada inválida.';
    res.status(400).json({ error: { message, code: 'VALIDATION_ERROR' } });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }

  // Sem PII em log: apenas o stack do erro interno + o request-id para correlação.
  logger.error({ requestId: req.id, err: err instanceof Error ? err.stack : err });
  res.status(500).json({
    error: { message: 'Erro interno do servidor.', code: 'INTERNAL_ERROR', requestId: req.id },
  });
}
