import { Router } from 'express';
import * as controller from '../controllers/budgetsController.js';

export const budgetsRouter = Router();

budgetsRouter.get('/', controller.list);
budgetsRouter.post('/', controller.upsert);
budgetsRouter.patch('/:id', controller.update);
budgetsRouter.delete('/:id', controller.remove);
