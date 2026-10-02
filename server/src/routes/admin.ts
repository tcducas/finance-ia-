import { Router } from 'express';
import * as controller from '../controllers/adminController.js';

export const adminRouter = Router();

adminRouter.get('/stats', controller.stats);
adminRouter.get('/users', controller.users);
adminRouter.patch('/users/:id/plan', controller.setPlan);
