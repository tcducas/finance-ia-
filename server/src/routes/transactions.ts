import { Router } from 'express';
import * as controller from '../controllers/transactionsController.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', controller.list);
transactionsRouter.post('/', controller.create);
transactionsRouter.patch('/:id', controller.update);
transactionsRouter.delete('/:id', controller.remove);
