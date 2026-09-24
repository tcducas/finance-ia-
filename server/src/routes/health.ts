import { Router } from 'express';
import { getReadiness } from '../services/healthService.js';

export const healthRouter = Router();

// Liveness — sem I/O, é o que a plataforma de deploy bate a cada poucos segundos.
healthRouter.get('/', (_req, res) => {
  res.json({ data: { status: 'ok', uptime: process.uptime() } });
});

// Readiness — checa dependências externas (memoizado, ver healthService).
healthRouter.get('/ready', async (_req, res) => {
  const result = await getReadiness();
  res.status(result.status === 'ok' ? 200 : 503).json({ data: result });
});
