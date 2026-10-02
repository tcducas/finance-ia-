import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { makeToken, stubDb, TEST_USER_ID } from './helpers.js';

vi.mock('../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock('../services/adminService.js', () => ({
  getStats: vi.fn(),
  listUsers: vi.fn(),
  setUserPlan: vi.fn(),
}));
vi.mock('../services/boardService.js', () => ({ getBoard: vi.fn() }));
vi.mock('../services/marketService.js', () => ({
  getQuotes: vi.fn(),
  getMovers: vi.fn(),
  getAssetDetail: vi.fn(),
}));

const supabase = vi.mocked(await import('../lib/supabase.js'));
const adminService = vi.mocked(await import('../services/adminService.js'));
const boardService = vi.mocked(await import('../services/boardService.js'));
const marketService = vi.mocked(await import('../services/marketService.js'));
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  supabase.createUserClient.mockReturnValue(stubDb({ plan: 'free', is_admin: false }));
  supabase.createServiceClient.mockReturnValue(stubDb({ count: 0 }));
});

function asPlan(plan: 'free' | 'pro', isAdmin = false) {
  supabase.createUserClient.mockReturnValue(stubDb({ plan, is_admin: isAdmin }));
}

describe('mercado internacional é do plano pro', () => {
  it('recusa com 402 PLAN_REQUIRED no free', async () => {
    const res = await request(app)
      .get('/api/market/quotes?tickers=US:AAPL')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
    expect(marketService.getQuotes).not.toHaveBeenCalled();
  });

  it('recusa também sem token nenhum (vale free)', async () => {
    const res = await request(app).get('/api/market/quotes?tickers=US:AAPL');
    expect(res.status).toBe(402);
  });

  it('libera no pro', async () => {
    asPlan('pro');
    marketService.getQuotes.mockResolvedValue([] as never);
    const res = await request(app)
      .get('/api/market/quotes?tickers=US:AAPL')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(marketService.getQuotes).toHaveBeenCalled();
  });

  it('não bloqueia mercado nacional no free', async () => {
    marketService.getQuotes.mockResolvedValue([] as never);
    const res = await request(app).get('/api/market/quotes?tickers=BR:PETR4');
    expect(res.status).toBe(200);
  });
});

describe('board recortado pelo plano', () => {
  const board = {
    market: 'CRYPTO' as const,
    symbol: 'BTCBRL',
    name: 'BTC/BRL',
    base: 'BTC',
    quote: 'BRL',
    interval: '1d',
    support: { intervals: ['15m', '1h', '4h', '1d'], book: true, trades: true },
    stats: { price: 1, change: 0, changePercent: 0, high: null, low: null, open: null, volume: null },
    candles: [],
    book: { bids: [], asks: [], spread: 0, spreadPercent: 0, buyPressure: 0.5 },
    trades: [{ id: 1, price: 1, qty: 1, time: 'x', side: 'compra' as const }],
    delayed: false as const,
    tickSize: 0.01,
    stepSize: 0.01,
    candlesUnavailable: false,
  };

  it('free perde livro, tape e períodos intraday', async () => {
    boardService.getBoard.mockResolvedValue(board as never);
    const res = await request(app).get('/api/market/board/BTCBRL?market=CRYPTO&interval=15m');

    expect(res.status).toBe(200);
    expect(res.body.data.support.intervals).toEqual(['1d']);
    expect(res.body.data.support.book).toBe(false);
    // Gating de verdade: os dados saem da RESPOSTA, não só da UI.
    expect(res.body.data.book).toBeNull();
    expect(res.body.data.trades).toBeNull();
    expect(res.body.data.plan).toBe('free');
  });

  it('free nem busca o candle intraday que não pode mostrar', async () => {
    boardService.getBoard.mockResolvedValue(board as never);
    await request(app).get('/api/market/board/BTCBRL?market=CRYPTO&interval=15m');

    expect(boardService.getBoard).toHaveBeenCalledWith('BTCBRL', '1d', 'CRYPTO');
  });

  it('pro recebe livro, tape e todos os períodos', async () => {
    asPlan('pro');
    boardService.getBoard.mockResolvedValue(board as never);
    const res = await request(app)
      .get('/api/market/board/BTCBRL?market=CRYPTO&interval=15m')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.body.data.support.intervals).toEqual(['15m', '1h', '4h', '1d']);
    expect(res.body.data.book).not.toBeNull();
    expect(res.body.data.trades).toHaveLength(1);
    expect(boardService.getBoard).toHaveBeenCalledWith('BTCBRL', '15m', 'CRYPTO');
  });
});

describe('painel admin concede plano', () => {
  it('bloqueia quem não é admin (403)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${TEST_USER_ID}/plan`)
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ plan: 'pro' });

    expect(res.status).toBe(403);
    expect(adminService.setUserPlan).not.toHaveBeenCalled();
  });

  it('admin concede pro a outro usuário', async () => {
    asPlan('free', true);
    const target = '44444444-4444-4444-8444-444444444444';
    adminService.setUserPlan.mockResolvedValue({ id: target, plan: 'pro' } as never);

    const res = await request(app)
      .patch(`/api/admin/users/${target}/plan`)
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ plan: 'pro' });

    expect(res.status).toBe(200);
    expect(adminService.setUserPlan).toHaveBeenCalledWith(target, 'pro');
  });

  it('recusa plano inexistente (400)', async () => {
    asPlan('free', true);
    const res = await request(app)
      .patch(`/api/admin/users/${TEST_USER_ID}/plan`)
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ plan: 'enterprise' });

    expect(res.status).toBe(400);
    expect(adminService.setUserPlan).not.toHaveBeenCalled();
  });

  it('admin não rebaixa o próprio plano pelo painel', async () => {
    asPlan('pro', true);
    const res = await request(app)
      .patch(`/api/admin/users/${TEST_USER_ID}/plan`)
      .set('Authorization', `Bearer ${await makeToken()}`)
      .send({ plan: 'free' });

    expect(res.status).toBe(403);
    expect(adminService.setUserPlan).not.toHaveBeenCalled();
  });

  it('lista usuários para o admin', async () => {
    asPlan('free', true);
    adminService.listUsers.mockResolvedValue([] as never);
    const res = await request(app)
      .get('/api/admin/users?q=thales')
      .set('Authorization', `Bearer ${await makeToken()}`);

    expect(res.status).toBe(200);
    expect(adminService.listUsers).toHaveBeenCalledWith('thales');
  });
});
