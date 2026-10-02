import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { monthSeries } from '../services/evolutionService.js';
import { makeToken, stubDb, TEST_USER_ID } from './helpers.js';

// attachPlan lê profiles.plan em toda rota com plano: sem este duplo, a
// requisição esperaria um Supabase real e o teste estouraria o timeout.
vi.mock('../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock('../services/evolutionService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/evolutionService.js')>();
  return { ...actual, getEvolution: vi.fn(), saveSnapshot: vi.fn() };
});

const service = vi.mocked(await import('../services/evolutionService.js'));
const supabase = vi.mocked(await import('../lib/supabase.js'));
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  supabase.createUserClient.mockReturnValue(stubDb());
  supabase.createServiceClient.mockReturnValue(stubDb());
});

describe('monthSeries', () => {
  it('lista os últimos N meses em ordem crescente', () => {
    expect(monthSeries('2026-03', 4)).toEqual(['2025-12', '2026-01', '2026-02', '2026-03']);
  });

  it('atravessa a virada de ano', () => {
    expect(monthSeries('2026-01', 3)).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('com count 1 devolve só o mês final', () => {
    expect(monthSeries('2026-09', 1)).toEqual(['2026-09']);
  });
});

describe('GET /api/summary/evolution', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/summary/evolution');
    expect(res.status).toBe(401);
  });

  it('no plano free, recorta a janela para o teto de 6 meses', async () => {
    service.getEvolution.mockResolvedValue({} as never);
    const res = await request(app)
      .get('/api/summary/evolution')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    // Pedido default são 12 meses; o plano free entrega 6.
    expect(service.getEvolution).toHaveBeenCalledWith(expect.anything(), expect.any(String), 6);
    expect(res.body.data.months).toBe(6);
    expect(res.body.data.requestedMonths).toBe(12);
    expect(res.body.data.plan).toBe('free');
  });

  it('no plano pro, entrega a janela pedida até 24 meses', async () => {
    supabase.createUserClient.mockReturnValue(stubDb({ plan: 'pro' }));
    service.getEvolution.mockResolvedValue({} as never);
    await request(app)
      .get('/api/summary/evolution?month=2026-07&months=24')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(service.getEvolution).toHaveBeenCalledWith(expect.anything(), '2026-07', 24);
  });

  it('nem o pro passa do teto do plano', async () => {
    supabase.createUserClient.mockReturnValue(stubDb({ plan: 'pro' }));
    service.getEvolution.mockResolvedValue({} as never);
    await request(app)
      .get('/api/summary/evolution?months=60')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(service.getEvolution).toHaveBeenCalledWith(expect.anything(), expect.any(String), 24);
  });

  it('recusa janela fora do limite (400)', async () => {
    const res = await request(app)
      .get('/api/summary/evolution?months=999')
      .set('Authorization', `Bearer ${await makeToken()}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/summary/snapshot', () => {
  it('grava a foto do mês corrente e devolve 201', async () => {
    service.saveSnapshot.mockResolvedValue({ month: '2026-09', total: 41_600, classes: 3 });
    const res = await request(app)
      .post('/api/summary/snapshot')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(41_600);
    const [, userId] = service.saveSnapshot.mock.calls[0] ?? [];
    expect(userId).toBe(TEST_USER_ID);
  });

  it('recusa mês em formato inválido (400)', async () => {
    const res = await request(app)
      .post('/api/summary/snapshot')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ month: '09-2026' });

    expect(res.status).toBe(400);
    expect(service.saveSnapshot).not.toHaveBeenCalled();
  });
});
