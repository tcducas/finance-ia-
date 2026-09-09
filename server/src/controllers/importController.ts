import type { Request, Response } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { assetImportSchema, transactionImportSchema } from '../schemas/import.js';
import * as importService from '../services/importService.js';

export async function importTransactions(req: Request, res: Response) {
  const { rows } = transactionImportSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await importService.importTransactions(db, auth.userId, rows);
  res.status(201).json({ data });
}

export async function importAssets(req: Request, res: Response) {
  const { rows } = assetImportSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await importService.importAssets(db, auth.userId, rows);
  res.status(201).json({ data });
}
