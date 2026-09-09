import { z } from 'zod';
import type { OnboardingAnswers } from '../lib/riskScore.js';

const answer = z.number().int().min(0).max(3);

export const onboardingSchema = z.object({
  answers: z.object({
    horizon: answer,
    reaction: answer,
    experience: answer,
    income_stability: answer,
    goal: answer,
  }) satisfies z.ZodType<OnboardingAnswers>,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
