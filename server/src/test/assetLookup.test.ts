import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';

const app = createApp();

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = input.toString();
      if (url.includes('brapi.dev/api/available')) {
        return new Response(JSON.stringify({ stocks: ['ITSA4'], indexes: [] }), { status: 200 });
      }
      if (url.includes('brapi.dev/api/quote/')) {
        return new Response(
          JSON.stringify({ results: [{ symbol: 'ITSA4', shortName: 'Itaúsa', regularMarketPrice: 9.5 }] }),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    }),
  );
}

beforeEach(stubFetch);
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/market/search', () => {
  it('400 quando falta o parâmetro q', async () => {
    const res = await request(app).get('/api/market/search');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('200 com os resultados encontrados no catálogo', async () => {
    const res = await request(app).get('/api/market/search?q=ITSA&market=BR');
    expect(res.status).toBe(200);
    expect(res.body.data.results[0]).toMatchObject({ ticker: 'ITSA4', market: 'BR' });
  });
});

describe('GET /api/market/validate/:ticker', () => {
  it('404 ASSET_NOT_FOUND para ticker fora do catálogo', async () => {
    const res = await request(app).get('/api/market/validate/ZZZZ9?market=BR');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ASSET_NOT_FOUND');
  });

  it('200 com asset + quote para ticker válido', async () => {
    const res = await request(app).get('/api/market/validate/ITSA4?market=BR');
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.asset.ticker).toBe('ITSA4');
    expect(res.body.data.quote.price).toBe(9.5);
  });
});
