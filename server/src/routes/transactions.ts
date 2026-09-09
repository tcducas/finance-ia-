import { Router } from 'express';
import * as importController from '../controllers/importController.js';
import * as controller from '../controllers/transactionsController.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', controller.list);
transactionsRouter.post('/', controller.create);
transactionsRouter.post('/import', importController.importTransactions);
transactionsRouter.patch('/:id', controller.update);
transactionsRouter.delete('/:id', controller.remove);
