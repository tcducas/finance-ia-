import type { Request, Response } from 'express';
import { z } from 'zod';
import * as marketService from '../services/marketService.js';

const quotesQuerySchema = z.object({
  tickers: z.string().min(1, 'Informe os tickers separados por vírgula'),
});

const assetParamsSchema = z.object({ ticker: z.string().min(1).max(12) });
const assetQuerySchema = z.object({ range: z.string().optional() });

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
  const { ticker } = assetParamsSchema.parse(req.params);
  const { range } = assetQuerySchema.parse(req.query);
  const data = await marketService.getAssetDetail(ticker, range ?? '3mo');
  res.json({ data });
}
