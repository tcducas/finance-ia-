import { describe, expect, it } from 'vitest';
import { ONBOARDING_KEYS, scoreRiskProfile, type OnboardingAnswers } from '../lib/riskScore.js';

const uniform = (value: number): OnboardingAnswers =>
  Object.fromEntries(ONBOARDING_KEYS.map((key) => [key, value])) as OnboardingAnswers;

describe('scoreRiskProfile', () => {
  it('respostas mínimas → conservador (score 0)', () => {
    expect(scoreRiskProfile(uniform(0))).toEqual({ risk: 'conservador', score: 0 });
  });

  it('respostas máximas → arrojado (score 15)', () => {
    expect(scoreRiskProfile(uniform(3))).toEqual({ risk: 'arrojado', score: 15 });
  });

  it('meio da escala → moderado (score 10)', () => {
    expect(scoreRiskProfile(uniform(2))).toEqual({ risk: 'moderado', score: 10 });
  });

  it('fronteira 5/6 separa conservador de moderado', () => {
    expect(scoreRiskProfile({ ...uniform(1), goal: 1 }).risk).toBe('conservador'); // 5
    expect(scoreRiskProfile({ ...uniform(1), goal: 2 }).risk).toBe('moderado'); // 6
  });

  it('mais risco nunca reduz o score', () => {
    let previous = -1;
    for (const value of [0, 1, 2, 3]) {
      const { score } = scoreRiskProfile(uniform(value));
      expect(score).toBeGreaterThan(previous);
      previous = score;
    }
  });
});
