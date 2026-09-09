import { Router } from 'express';
import * as controller from '../controllers/marketController.js';

/**
 * Proxy de mercado — público (não expõe dado de usuário), com cache curto.
 * A chave do brapi vive só no backend.
 */
export const marketRouter = Router();

marketRouter.get('/quotes', controller.quotes);
marketRouter.get('/movers', controller.movers);
marketRouter.get('/asset/:ticker', controller.asset);
