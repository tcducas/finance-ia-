import type { Request, Response } from 'express';
import * as adminService from '../services/adminService.js';

export async function stats(_req: Request, res: Response) {
  res.json({ data: await adminService.getStats() });
}
