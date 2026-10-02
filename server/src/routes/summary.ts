import { Router } from 'express';
import * as controller from '../controllers/summaryController.js';

export const summaryRouter = Router();

summaryRouter.get('/', controller.summary);
summaryRouter.get('/spending', controller.spending);
summaryRouter.get('/evolution', controller.evolution);
summaryRouter.post('/snapshot', controller.snapshot);
