import { Router } from 'express';
import * as controller from '../controllers/portfolioController.js';

export const portfolioRouter = Router();

portfolioRouter.get('/', controller.list);
portfolioRouter.post('/', controller.create);
portfolioRouter.post('/import', controller.importHoldings);
portfolioRouter.get('/panorama', controller.panorama);
portfolioRouter.patch('/:id', controller.update);
portfolioRouter.delete('/:id', controller.remove);
