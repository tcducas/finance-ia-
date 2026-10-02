import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { aporteBand } from '../services/aiService.js';
import { makeToken, stubDb } from './helpers.js';

// attachPlan lê profiles.plan e a cota de IA lê ai_usage em toda chamada: sem
// este duplo, a requisição esperaria um Supabase real e estouraria o timeout.
vi.mock('../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

const supabase = vi.mocked(await import('../lib/supabase.js'));

// Sem GEMINI_API_KEY/GROQ_API_KEY no ambiente de teste: as rotas devem
// falhar com 503 AI_NOT_CONFIGURED — nunca vazar erro interno.
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  supabase.createUserClient.mockReturnValue(stubDb());
  supabase.createServiceClient.mockReturnValue(stubDb({ count: 0 }));
});

describe('POST /api/ai/chat', () => {
  it('exige autenticação (401)', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: 'oi' });
    expect(res.status).toBe(401);
  });

  it('valida a mensagem (400)', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('sem chave configurada devolve 503 AI_NOT_CONFIGURED', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ message: 'como está meu mês?' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
  });
});

describe('POST /api/ai/analyze', () => {
  it('valida aporte negativo (400)', async () => {
    const res = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ aporte: -100 });
    expect(res.status).toBe(400);
  });

  it('sem chave configurada devolve 503 AI_NOT_CONFIGURED', async () => {
    const res = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ aporte: 1000 });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
  });
});

describe('aporteBand', () => {
  it('nunca expõe o valor absoluto', () => {
    expect(aporteBand(1500)).toBe('R$ 1 mil – R$ 5 mil');
    expect(aporteBand(50)).toBe('até R$ 100');
    expect(aporteBand(50_000)).toBe('acima de R$ 20 mil');
  });
});
