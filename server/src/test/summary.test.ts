import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { makeToken } from './helpers.js';

vi.mock('../services/summaryService.js', () => ({
  getPeriodSummary: vi.fn(),
  getSpendingByCategory: vi.fn(),
}));

const service = vi.mocked(await import('../services/summaryService.js'));

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/summary', () => {
  it('devolve receitas, despesas, saldo e fixos × variáveis', async () => {
    service.getPeriodSummary.mockResolvedValue({
      receitas: 5000,
      despesas: 3200,
      saldo: 1800,
      fixos: 2100,
      variaveis: 1100,
    });

    const res = await request(app)
      .get('/api/summary?month=2026-07')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.saldo).toBe(1800);
    expect(service.getPeriodSummary).toHaveBeenCalledWith(expect.anything(), {
      from: '2026-07-01',
      to: '2026-07-31',
    });
  });

  it('exige autenticação (401)', async () => {
    const res = await request(app).get('/api/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/summary/spending', () => {
  it('devolve gastos por categoria ordenados', async () => {
    service.getSpendingByCategory.mockResolvedValue([
      { category: 'mercado', total: 640 },
      { category: 'lazer', total: 200 },
    ]);

    const res = await request(app)
      .get('/api/summary/spending?month=2026-07')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toEqual({ category: 'mercado', total: 640 });
  });
});
