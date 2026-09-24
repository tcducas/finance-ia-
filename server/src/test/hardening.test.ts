import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';

const app = createApp();

describe('request-id', () => {
  it('devolve X-Request-Id em toda resposta, ecoando o header de entrada', async () => {
    const res = await request(app).get('/api/health').set('X-Request-Id', 'abc-123');
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('gera um id quando o cliente não manda um', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});

describe('helmet', () => {
  it('seta headers de segurança básicos', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('GET /api/health', () => {
  it('responde ok sem tocar rede', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reporta os checks de dependências', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.checks).toHaveProperty('supabase');
    expect(res.body.data.checks).toHaveProperty('market');
    expect(res.body.data.checks).toHaveProperty('ai');
  });
});

describe('rate limit', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ results: [] }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fica desligado em NODE_ENV=test (skip) — não bloqueia a suíte inteira', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => request(app).get(`/api/market/quotes?tickers=TESTE${i}`)),
    );
    expect(results.every((r) => r.status !== 429)).toBe(true);
  });
});
