import { Router } from 'express';
import * as controller from '../controllers/goalsController.js';

export const goalsRouter = Router();

goalsRouter.get('/', controller.list);
goalsRouter.post('/', controller.create);
goalsRouter.patch('/:id', controller.update);
goalsRouter.delete('/:id', controller.remove);

/** Planejamento = metas + projeção + score. Rota separada, mesmo controller. */
export const planningRouter = Router();

planningRouter.get('/', controller.planning);
