import { Router } from 'express';
import * as controller from '../controllers/watchlistController.js';

export const watchlistRouter = Router();

watchlistRouter.get('/', controller.list);
watchlistRouter.post('/', controller.add);
watchlistRouter.delete('/:id', controller.remove);
