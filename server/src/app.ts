import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { attachPlan } from './middlewares/attachPlan.js';
import { apiLimiter, aiLimiter, marketLimiter } from './middlewares/rateLimit.js';
import { requestContext } from './middlewares/requestContext.js';
import { requireAdmin } from './middlewares/requireAdmin.js';
import { requireAuth } from './middlewares/requireAuth.js';
import { adminRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { assetsRouter } from './routes/assets.js';
import { budgetsRouter } from './routes/budgets.js';
import { goalsRouter, planningRouter } from './routes/goals.js';
import { healthRouter } from './routes/health.js';
import { marketRouter } from './routes/market.js';
import { meRouter } from './routes/me.js';
import { portfolioRouter } from './routes/portfolio.js';
import { onboardingRouter } from './routes/onboarding.js';
import { summaryRouter } from './routes/summary.js';
import { transactionsRouter } from './routes/transactions.js';
import { watchlistRouter } from './routes/watchlist.js';

export function createApp(): express.Express {
  const app = express();

  // Nº de proxies reversos na frente do server — exigido para o rate limit
  // identificar o IP real em vez do IP do proxy (0 em localhost/dev).
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestContext);
  app.use(
    helmet({
      // O Vite middleware (dev) precisa de inline/eval + websocket do HMR;
      // em produção o client já é build estático, CSP padrão do helmet serve.
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  if (env.CORS_ORIGINS) {
    const origins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
    app.use(cors({ origin: origins, credentials: true }));
  }
  // Limite maior que o default (100kb): o import de carteira aceita até 2000
  // linhas de CSV no corpo da requisição.
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiLimiter);

  app.use('/api/health', healthRouter);
  // Público: não expõe dado de usuário; a chave externa fica no backend.
  // attachPlan autentica de forma OPCIONAL — sem token vale o plano free, e os
  // limites do plano (mercados, períodos de candle, livro) saem daí.
  app.use('/api/market', marketLimiter, attachPlan, marketRouter);
  app.use('/api/me', requireAuth, meRouter);
  app.use('/api/onboarding', requireAuth, onboardingRouter);
  app.use('/api/admin', requireAuth, requireAdmin, adminRouter);
  app.use('/api/transactions', requireAuth, transactionsRouter);
  app.use('/api/watchlist', requireAuth, watchlistRouter);
  app.use('/api/budgets', requireAuth, budgetsRouter);
  app.use('/api/assets', requireAuth, assetsRouter);
  app.use('/api/summary', requireAuth, attachPlan, summaryRouter);
  app.use('/api/portfolio', requireAuth, attachPlan, portfolioRouter);
  app.use('/api/goals', requireAuth, goalsRouter);
  app.use('/api/planning', requireAuth, planningRouter);
  app.use('/api/ai', requireAuth, attachPlan, aiLimiter, aiRouter);

  // 404 padrão para rotas de API desconhecidas.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { message: 'Rota não encontrada.', code: 'NOT_FOUND' } });
  });

  app.use(errorHandler);

  return app;
}
