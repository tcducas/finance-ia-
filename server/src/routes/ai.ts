import { Router } from 'express';
import * as controller from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.post('/chat', controller.chat);
aiRouter.post('/analyze', controller.analyze);
