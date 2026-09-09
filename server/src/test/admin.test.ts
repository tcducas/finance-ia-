import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { makeToken } from './helpers.js';

vi.mock('../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock('../services/adminService.js', () => ({
  getStats: vi.fn(),
}));

const supabase = vi.mocked(await import('../lib/supabase.js'));
const adminService = vi.mocked(await import('../services/adminService.js'));
const app = createApp();

/** Stub encadeável: db.from(...).select(...).eq(...).maybeSingle() */
function stubDbWithAdminFlag(isAdmin: boolean | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: isAdmin === null ? null : { is_admin: isAdmin },
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof supabase.createUserClient>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/stats', () => {
  it('recusa sem token (401)', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('bloqueia usuário sem is_admin (403) sem chamar o service', async () => {
    supabase.createUserClient.mockReturnValue(stubDbWithAdminFlag(false));
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(adminService.getStats).not.toHaveBeenCalled();
  });

  it('libera admin e devolve as contagens', async () => {
    supabase.createUserClient.mockReturnValue(stubDbWithAdminFlag(true));
    adminService.getStats.mockResolvedValue({
      users: 3,
      transactions: 42,
      aiMessages: 10,
      watchlistItems: 7,
    });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toBe(42);
    expect(adminService.getStats).toHaveBeenCalledOnce();
  });
});
