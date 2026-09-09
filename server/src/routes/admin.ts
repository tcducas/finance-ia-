import { Router } from 'express';
import * as controller from '../controllers/adminController.js';

export const adminRouter = Router();

adminRouter.get('/stats', controller.stats);
