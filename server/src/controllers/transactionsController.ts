import type { Request, Response } from 'express';
import { currentMonth, monthRange } from '../lib/period.js';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import {
  idParamSchema,
  periodQuerySchema,
  transactionCreateSchema,
  transactionUpdateSchema,
} from '../schemas/transaction.js';
import * as transactionsService from '../services/transactionsService.js';

export async function list(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await transactionsService.listTransactions(db, monthRange(month ?? currentMonth()));
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = transactionCreateSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await transactionsService.createTransaction(db, auth.userId, input);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = transactionUpdateSchema.parse(req.body);
  const db = createUserClient(getAuth(req).token);
  const data = await transactionsService.updateTransaction(db, id, input);
  res.json({ data });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await transactionsService.deleteTransaction(db, id);
  res.json({ data: { id } });
}
