import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { Transaction } from '../services/transactionsService.js';
import { makeToken, TEST_USER_ID } from './helpers.js';

vi.mock('../services/transactionsService.js', () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

const service = vi.mocked(await import('../services/transactionsService.js'));

const app = createApp();

const sample: Transaction = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: TEST_USER_ID,
  type: 'despesa',
  category: 'mercado',
  amount: 640,
  occurred_on: '2026-07-10',
  description: 'PLACEHOLDER compras do mês',
  is_recurring: false,
  created_at: '2026-07-10T12:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('autenticação', () => {
  it('recusa requisição sem token (401)', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('recusa token assinado com outro segredo (401)', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer token-falso');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/transactions', () => {
  it('lista movimentações do mês no contrato { data }', async () => {
    service.listTransactions.mockResolvedValue([sample]);
    const res = await request(app)
      .get('/api/transactions?month=2026-07')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('mercado');
    expect(service.listTransactions).toHaveBeenCalledWith(expect.anything(), {
      from: '2026-07-01',
      to: '2026-07-31',
    });
  });

  it('rejeita mês mal formatado (400)', async () => {
    const res = await request(app)
      .get('/api/transactions?month=julho')
      .set('Authorization', `Bearer ${await makeToken()}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/transactions', () => {
  it('cria movimentação válida (201)', async () => {
    service.createTransaction.mockResolvedValue(sample);
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ type: 'despesa', amount: 640, category: 'mercado', occurred_on: '2026-07-10' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(sample.id);
    expect(service.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      TEST_USER_ID,
      expect.objectContaining({ type: 'despesa', amount: 640 }),
    );
  });

  it('rejeita valor negativo (400) sem chegar ao service', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ type: 'despesa', amount: -5, category: 'mercado', occurred_on: '2026-07-10' });

    expect(res.status).toBe(400);
    expect(service.createTransaction).not.toHaveBeenCalled();
  });

  it('rejeita tipo desconhecido (400)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ type: 'transferencia', amount: 10, category: 'x', occurred_on: '2026-07-10' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('remove e devolve o id', async () => {
    service.deleteTransaction.mockResolvedValue();
    const res = await request(app)
      .delete(`/api/transactions/${sample.id}`)
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(sample.id);
  });

  it('rejeita id que não é uuid (400)', async () => {
    const res = await request(app)
      .delete('/api/transactions/123')
      .set('Authorization', `Bearer ${await makeToken()}`);
    expect(res.status).toBe(400);
  });
});
