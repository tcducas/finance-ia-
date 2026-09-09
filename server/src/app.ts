import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { requireAuth } from './middlewares/requireAuth.js';
import { aiRouter } from './routes/ai.js';
import { assetsRouter } from './routes/assets.js';
import { budgetsRouter } from './routes/budgets.js';
import { healthRouter } from './routes/health.js';
import { marketRouter } from './routes/market.js';
import { summaryRouter } from './routes/summary.js';
import { transactionsRouter } from './routes/transactions.js';
import { watchlistRouter } from './routes/watchlist.js';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.use('/api/health', healthRouter);
  // Público: não expõe dado de usuário; a chave externa fica no backend.
  app.use('/api/market', marketRouter);
  app.use('/api/transactions', requireAuth, transactionsRouter);
  app.use('/api/watchlist', requireAuth, watchlistRouter);
  app.use('/api/budgets', requireAuth, budgetsRouter);
  app.use('/api/assets', requireAuth, assetsRouter);
  app.use('/api/summary', requireAuth, summaryRouter);
  app.use('/api/ai', requireAuth, aiRouter);

  // 404 padrão para rotas de API desconhecidas.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { message: 'Rota não encontrada.', code: 'NOT_FOUND' } });
  });

  app.use(errorHandler);

  return app;
}
