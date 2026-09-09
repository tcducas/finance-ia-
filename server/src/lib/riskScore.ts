/**
 * Perfil do investidor a partir do quiz de onboarding.
 *
 * Determinístico: soma simples das 5 respostas (0..3 cada, máx. 15) e faixa.
 * A IA NUNCA decide o perfil — é regra pura, testável, igual no client.
 */

export const ONBOARDING_KEYS = [
  'horizon', // horizonte de uso do dinheiro
  'reaction', // reação a uma queda de 20%
  'experience', // experiência com investimentos
  'income_stability', // estabilidade da renda
  'goal', // objetivo principal
] as const;

export type OnboardingKey = (typeof ONBOARDING_KEYS)[number];
export type OnboardingAnswers = Record<OnboardingKey, number>;
export type RiskProfile = 'conservador' | 'moderado' | 'arrojado';

export interface RiskResult {
  risk: RiskProfile;
  score: number;
}

export function scoreRiskProfile(answers: OnboardingAnswers): RiskResult {
  const score = ONBOARDING_KEYS.reduce((sum, key) => sum + (answers[key] ?? 0), 0);
  const risk: RiskProfile = score <= 5 ? 'conservador' : score <= 10 ? 'moderado' : 'arrojado';
  return { risk, score };
}
