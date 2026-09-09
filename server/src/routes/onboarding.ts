import { Router } from 'express';
import * as controller from '../controllers/profileController.js';

export const onboardingRouter = Router();

onboardingRouter.post('/', controller.onboarding);
