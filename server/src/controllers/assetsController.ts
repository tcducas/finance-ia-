import type { Request, Response } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { assetCreateSchema, assetUpdateSchema } from '../schemas/asset.js';
import { idParamSchema } from '../schemas/transaction.js';
import * as assetsService from '../services/assetsService.js';

export async function list(req: Request, res: Response) {
  const db = createUserClient(getAuth(req).token);
  const data = await assetsService.listAssets(db);
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = assetCreateSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await assetsService.createAsset(db, auth.userId, input);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = assetUpdateSchema.parse(req.body);
  const db = createUserClient(getAuth(req).token);
  const data = await assetsService.updateAsset(db, id, input);
  res.json({ data });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await assetsService.deleteAsset(db, id);
  res.json({ data: { id } });
}
