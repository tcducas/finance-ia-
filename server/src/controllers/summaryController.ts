import type { Request, Response } from 'express';
import { currentMonth, monthRange } from '../lib/period.js';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { periodQuerySchema } from '../schemas/transaction.js';
import * as summaryService from '../services/summaryService.js';

export async function summary(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await summaryService.getPeriodSummary(db, monthRange(month ?? currentMonth()));
  res.json({ data });
}

export async function spending(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await summaryService.getSpendingByCategory(db, monthRange(month ?? currentMonth()));
  res.json({ data });
}
