import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { marketQuerySchema, searchQuerySchema, tickerParamSchema } from '../schemas/market.js';
import * as assetLookupService from '../services/assetLookupService.js';
import * as marketService from '../services/marketService.js';

const quotesQuerySchema = z.object({
  tickers: z.string().min(1, 'Informe os tickers separados por vírgula'),
});

const assetQuerySchema = marketQuerySchema.extend({ range: z.string().optional() });

export async function quotes(req: Request, res: Response) {
  const { tickers } = quotesQuerySchema.parse(req.query);
  const data = await marketService.getQuotes(tickers.split(','));
  res.json({ data });
}

export async function movers(_req: Request, res: Response) {
  const data = await marketService.getMovers();
  res.json({ data });
}

export async function asset(req: Request, res: Response) {
  const { ticker } = tickerParamSchema.parse(req.params);
  const { range, market } = assetQuerySchema.parse(req.query);
  const prefixed = market ? `${market}:${ticker}` : ticker;
  const data = await marketService.getAssetDetail(prefixed, range ?? '3mo');
  res.json({ data });
}

/** GET /api/market/search?q=&market=&limit= — usado pela watchlist e pelo copiloto. */
export async function search(req: Request, res: Response) {
  const { q, market, limit } = searchQuerySchema.parse(req.query);
  const data = await assetLookupService.searchAssets(q, market, limit);
  res.json({ data });
}

/** GET /api/market/validate/:ticker?market= — o "esse ativo existe?" de verdade. */
export async function validate(req: Request, res: Response) {
  const { ticker } = tickerParamSchema.parse(req.params);
  const { market } = marketQuerySchema.parse(req.query);
  const result = await assetLookupService.validateTicker(ticker, market);
  if (!result) {
    throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
  }
  res.json({ data: { valid: true, ...result } });
}
