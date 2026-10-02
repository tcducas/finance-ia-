import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { entitlementsFor } from '../lib/entitlements.js';
import type { Me } from '../services/profileService.js';
import { makeToken, TEST_USER_ID } from './helpers.js';

vi.mock('../services/profileService.js', () => ({
  getMe: vi.fn(),
  saveOnboarding: vi.fn(),
}));

const service = vi.mocked(await import('../services/profileService.js'));
const app = createApp();

const me: Me = {
  id: TEST_USER_ID,
  email: 'user@example.com',
  full_name: 'Fulano',
  is_admin: false,
  plan: 'free',
  plan_updated_at: null,
  entitlements: entitlementsFor('free'),
  onboarded_at: null,
  risk_profile: null,
};

const validAnswers = {
  horizon: 2,
  reaction: 2,
  experience: 1,
  income_stability: 3,
  goal: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/me', () => {
  it('recusa sem token (401)', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('devolve o perfil no contrato { data }', async () => {
    service.getMe.mockResolvedValue(me);
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(TEST_USER_ID);
    expect(service.getMe).toHaveBeenCalledWith(expect.anything(), TEST_USER_ID);
  });
});

describe('POST /api/onboarding', () => {
  it('rejeita resposta fora da escala (400) sem chegar ao service', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ answers: { ...validAnswers, horizon: 9 } });

    expect(res.status).toBe(400);
    expect(service.saveOnboarding).not.toHaveBeenCalled();
  });

  it('aceita respostas válidas e chama o service', async () => {
    service.saveOnboarding.mockResolvedValue({ ...me, onboarded_at: '2026-09-09T00:00:00Z', risk_profile: 'moderado' });
    const res = await request(app)
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ answers: validAnswers });

    expect(res.status).toBe(200);
    expect(res.body.data.risk_profile).toBe('moderado');
    expect(service.saveOnboarding).toHaveBeenCalledWith(
      expect.anything(),
      TEST_USER_ID,
      expect.objectContaining({ horizon: 2, goal: 2 }),
    );
  });
});
