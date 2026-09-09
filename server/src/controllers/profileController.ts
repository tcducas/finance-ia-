import type { Request, Response } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { getAuth } from '../middlewares/requireAuth.js';
import { onboardingSchema } from '../schemas/onboarding.js';
import * as profileService from '../services/profileService.js';

export async function me(req: Request, res: Response) {
  const auth = getAuth(req);
  const data = await profileService.getMe(createUserClient(auth.token), auth.userId);
  res.json({ data });
}

export async function onboarding(req: Request, res: Response) {
  const { answers } = onboardingSchema.parse(req.body);
  const auth = getAuth(req);
  const data = await profileService.saveOnboarding(
    createUserClient(auth.token),
    auth.userId,
    answers,
  );
  res.json({ data });
}
