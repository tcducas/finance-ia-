import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { makeToken, stubDb, TEST_USER_ID } from './helpers.js';

vi.mock('../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock('../services/portfolioService.js', () => ({
  listHoldings: vi.fn(),
  createHolding: vi.fn(),
  updateHolding: vi.fn(),
  deleteHolding: vi.fn(),
  importHoldings: vi.fn(),
  getPanorama: vi.fn(),
  DEFAULT_ATTRACTIVENESS_RATE: 0.105,
}));
vi.mock('../services/aiService.js', () => ({
  chat: vi.fn(),
  analyze: vi.fn(),
  reviewPortfolio: vi.fn(),
  aporteBand: vi.fn(() => 'faixa'),
}));

const supabase = vi.mocked(await import('../lib/supabase.js'));
const service = vi.mocked(await import('../services/portfolioService.js'));
const aiService = vi.mocked(await import('../services/aiService.js'));
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  supabase.createUserClient.mockReturnValue(stubDb({ plan: 'free', risk_profile: 'moderado' }));
  supabase.createServiceClient.mockReturnValue(stubDb({ count: 0 }));
});

const holding = {
  id: '55555555-5555-4555-8555-555555555555',
  user_id: TEST_USER_ID,
  ticker: 'PETR4',
  market: 'BR' as const,
  asset_class: 'acao',
  quantity: 100,
  avg_price: 30,
  acquired_on: '2025-10-01',
  dividends_received: 0,
  created_at: '2026-01-01T00:00:00Z',
};

describe('autenticação', () => {
  it('recusa /api/portfolio sem token', async () => {
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/portfolio', () => {
  it('cria posição aplicando os defaults do schema', async () => {
    service.createHolding.mockResolvedValue(holding);
    const res = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ ticker: 'petr4', quantity: 100, avg_price: 30 });

    expect(res.status).toBe(201);
    expect(service.createHolding).toHaveBeenCalledWith(
      expect.anything(),
      TEST_USER_ID,
      expect.objectContaining({ market: 'BR', asset_class: 'acao', dividends_received: 0 }),
    );
  });

  it('recusa quantidade zero (400)', async () => {
    const res = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ ticker: 'PETR4', quantity: 0, avg_price: 30 });

    expect(res.status).toBe(400);
    expect(service.createHolding).not.toHaveBeenCalled();
  });

  it('recusa posição no mercado internacional no plano free (402)', async () => {
    const res = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ ticker: 'AAPL', market: 'US', quantity: 10, avg_price: 200 });

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
    expect(service.createHolding).not.toHaveBeenCalled();
  });
});

describe('POST /api/portfolio/import', () => {
  it('importa em lote', async () => {
    service.importHoldings.mockResolvedValue({ inserted: 2 });
    const res = await request(app)
      .post('/api/portfolio/import')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({
        rows: [
          { ticker: 'PETR4', quantity: 100, avg_price: 30 },
          { ticker: 'HGLG11', asset_class: 'fii', quantity: 10, avg_price: 150 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.inserted).toBe(2);
  });

  it('recusa lote vazio (400)', async () => {
    const res = await request(app)
      .post('/api/portfolio/import')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ rows: [] });

    expect(res.status).toBe(400);
    expect(service.importHoldings).not.toHaveBeenCalled();
  });

  it('um ativo US no lote barra o lote inteiro no free (402)', async () => {
    const res = await request(app)
      .post('/api/portfolio/import')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({
        rows: [
          { ticker: 'PETR4', quantity: 100, avg_price: 30 },
          { ticker: 'AAPL', market: 'US', quantity: 10, avg_price: 200 },
        ],
      });

    expect(res.status).toBe(402);
    expect(service.importHoldings).not.toHaveBeenCalled();
  });
});

describe('GET /api/portfolio/panorama', () => {
  it('usa o perfil do investidor e devolve o panorama', async () => {
    service.listHoldings.mockResolvedValue([holding]);
    service.getPanorama.mockResolvedValue({ currentValue: 3600 } as never);

    const res = await request(app)
      .get('/api/portfolio/panorama')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentValue).toBe(3600);
    const [, profile] = service.getPanorama.mock.calls[0] ?? [];
    expect(profile).toBe('moderado');
  });

  it('recusa taxa de atratividade em percentual em vez de decimal (400)', async () => {
    const res = await request(app)
      .get('/api/portfolio/panorama?rate=10')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/portfolio', () => {
  it('exige objetivo descrito (400)', async () => {
    const res = await request(app)
      .post('/api/ai/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ objetivo: 'oi' });

    expect(res.status).toBe(400);
    expect(aiService.reviewPortfolio).not.toHaveBeenCalled();
  });

  it('recusa carteira vazia antes de gastar chamada de IA', async () => {
    service.listHoldings.mockResolvedValue([]);
    const res = await request(app)
      .post('/api/ai/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ objetivo: 'quero viver de renda em 15 anos' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_PORTFOLIO');
    expect(aiService.reviewPortfolio).not.toHaveBeenCalled();
  });

  it('entrega panorama e avaliação quando há carteira', async () => {
    service.listHoldings.mockResolvedValue([holding]);
    service.getPanorama.mockResolvedValue({ currentValue: 3600 } as never);
    aiService.reviewPortfolio.mockResolvedValue({ panorama: 'ok' } as never);

    const res = await request(app)
      .post('/api/ai/portfolio')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ objetivo: 'quero viver de renda em 15 anos' });

    expect(res.status).toBe(200);
    expect(res.body.data.review.panorama).toBe('ok');
    expect(res.body.data.panorama.currentValue).toBe(3600);
    // O objetivo do usuário chega inteiro ao serviço de IA.
    const [params] = aiService.reviewPortfolio.mock.calls[0] ?? [];
    expect(params?.objetivo).toBe('quero viver de renda em 15 anos');
  });
});
