import type { Request, Response } from 'express';
import { currentMonth } from '../lib/period.js';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { goalCreateSchema, goalUpdateSchema, planningQuerySchema } from '../schemas/goal.js';
import { idParamSchema, periodQuerySchema } from '../schemas/transaction.js';
import * as goalsService from '../services/goalsService.js';
import * as planningService from '../services/planningService.js';

export async function list(req: Request, res: Response) {
  const db = createUserClient(getAuth(req).token);
  const data = await goalsService.listGoals(db);
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = goalCreateSchema.parse(req.body);
  const auth = getAuth(req);
  const db = createUserClient(auth.token);
  const data = await goalsService.createGoal(db, auth.userId, input);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = goalUpdateSchema.parse(req.body);
  const db = createUserClient(getAuth(req).token);
  const data = await goalsService.updateGoal(db, id, input);
  res.json({ data });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const db = createUserClient(getAuth(req).token);
  await goalsService.deleteGoal(db, id);
  res.json({ data: { id } });
}

/** GET /api/planning?month=&horizon= — projeções + score da tela Planejamento. */
export async function planning(req: Request, res: Response) {
  const { month } = periodQuerySchema.parse(req.query);
  const { horizon } = planningQuerySchema.parse(req.query);
  const db = createUserClient(getAuth(req).token);
  const data = await planningService.getPlanning(db, month ?? currentMonth(), horizon);
  res.json({ data });
}
