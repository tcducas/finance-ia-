import { Router } from 'express';
import * as controller from '../controllers/profileController.js';

export const meRouter = Router();

meRouter.get('/', controller.me);
