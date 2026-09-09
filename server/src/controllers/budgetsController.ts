import type { Request, Response } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { budgetCreateSchema, budgetUpdateSchema } from '../schemas/budget.js';
import { idParamSchema } from '../schemas/transaction.js';
import * as budgetsService from '../services/budgetsService.js';

export async function list(req: Request, res: Response) {
  const db = createUserClient(getAuth(req).token);
  const data = await budgetsService.listBudgets(db);
  res.json({ data });
}

export async function upsert(req: Request, res: Response) {
  const input = budgetCreateSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await budgetsService.upsertBudget(db, auth.userId, input);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = budgetUpdateSchema.parse(req.body);
  const db = createUserClient(getAuth(req).token);
  const data = await budgetsService.updateBudget(db, id, input);
  res.json({ data });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await budgetsService.deleteBudget(db, id);
  res.json({ data: { id } });
}
