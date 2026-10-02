import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { Goal } from '../services/goalsService.js';
import { makeToken, TEST_USER_ID } from './helpers.js';

vi.mock('../services/goalsService.js', () => ({
  listGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock('../services/planningService.js', () => ({
  getPlanning: vi.fn(),
}));

const goals = vi.mocked(await import('../services/goalsService.js'));
const planning = vi.mocked(await import('../services/planningService.js'));

const app = createApp();

const sample: Goal = {
  id: '33333333-3333-4333-8333-333333333333',
  user_id: TEST_USER_ID,
  name: 'Reserva de emergência',
  kind: 'reserva',
  target_amount: 30_000,
  current_amount: 8000,
  monthly_contribution: 1200,
  annual_rate: 0.1,
  target_date: null,
  priority: 1,
  created_at: '2026-09-01T12:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('autenticação', () => {
  it('recusa /api/goals sem token (401)', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('recusa /api/planning sem token (401)', async () => {
    const res = await request(app).get('/api/planning');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/goals', () => {
  it('lista metas no contrato { data }', async () => {
    goals.listGoals.mockResolvedValue([sample]);
    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Reserva de emergência');
  });
});

describe('POST /api/goals', () => {
  it('cria com 201 e aplica os defaults do schema', async () => {
    goals.createGoal.mockResolvedValue(sample);
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ name: 'Reserva de emergência', target_amount: 30_000 });

    expect(res.status).toBe(201);
    expect(goals.createGoal).toHaveBeenCalledWith(
      expect.anything(),
      TEST_USER_ID,
      expect.objectContaining({ kind: 'geral', current_amount: 0, annual_rate: 0, priority: 2 }),
    );
  });

  it('recusa meta sem valor-alvo (400)', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ name: 'Sem alvo' });

    expect(res.status).toBe(400);
    expect(goals.createGoal).not.toHaveBeenCalled();
  });

  it('recusa taxa em percentual em vez de decimal (400)', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ name: 'Taxa errada', target_amount: 1000, annual_rate: 10 });

    expect(res.status).toBe(400);
    expect(goals.createGoal).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/goals/:id', () => {
  it('recusa id que não é uuid (400)', async () => {
    const res = await request(app)
      .delete('/api/goals/nao-e-uuid')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(400);
    expect(goals.deleteGoal).not.toHaveBeenCalled();
  });

  it('devolve o id removido', async () => {
    goals.deleteGoal.mockResolvedValue(undefined);
    const res = await request(app)
      .delete(`/api/goals/${sample.id}`)
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: sample.id });
  });
});

describe('GET /api/planning', () => {
  it('usa o mês corrente e horizonte 60 por default', async () => {
    planning.getPlanning.mockResolvedValue({} as never);
    const res = await request(app)
      .get('/api/planning')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    const [, month, horizon] = planning.getPlanning.mock.calls[0] ?? [];
    expect(month).toMatch(/^\d{4}-\d{2}$/);
    expect(horizon).toBe(60);
  });

  it('respeita month e horizon da query', async () => {
    planning.getPlanning.mockResolvedValue({} as never);
    await request(app)
      .get('/api/planning?month=2026-07&horizon=120')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(planning.getPlanning).toHaveBeenCalledWith(expect.anything(), '2026-07', 120);
  });

  it('recusa horizonte fora do limite (400)', async () => {
    const res = await request(app)
      .get('/api/planning?horizon=9999')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(400);
  });
});
