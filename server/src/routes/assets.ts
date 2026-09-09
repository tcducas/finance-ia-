import { Router } from 'express';
import * as controller from '../controllers/assetsController.js';

export const assetsRouter = Router();

assetsRouter.get('/', controller.list);
assetsRouter.post('/', controller.create);
assetsRouter.patch('/:id', controller.update);
assetsRouter.delete('/:id', controller.remove);
