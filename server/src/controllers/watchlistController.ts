import type { Request, Response } from 'express';
import { z } from 'zod';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { marketIdSchema } from '../schemas/market.js';
import { idParamSchema } from '../schemas/transaction.js';
import * as watchlistService from '../services/watchlistService.js';

const addSchema = z.object({
  ticker: z
    .string()
    .trim()
    .regex(/^(?:(?:BR|CRYPTO|US):)?[A-Za-z0-9^.]{1,20}$/, 'Ticker inválido'),
  market: marketIdSchema.optional(),
});

export async function list(req: Request, res: Response) {
  const db = createUserClient(getAuth(req).token);
  const data = await watchlistService.listWatchlist(db);
  res.json({ data });
}

export async function add(req: Request, res: Response) {
  const { ticker, market } = addSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await watchlistService.addToWatchlist(db, auth.userId, ticker, market);
  res.status(201).json({ data });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await watchlistService.removeFromWatchlist(db, id);
  res.json({ data: { id } });
}
