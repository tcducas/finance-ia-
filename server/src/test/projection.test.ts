import { describe, expect, it } from 'vitest';
import {
  buildScenarios,
  futureValue,
  monthlyRate,
  monthsToTarget,
  projectBalance,
  requiredContribution,
} from '../lib/projection.js';

describe('monthlyRate', () => {
  it('capitaliza de forma composta, não dividindo por 12', () => {
    // 12,68% a.a. ≈ 1% ao mês composto.
    expect(monthlyRate(0.1268)).toBeCloseTo(0.01, 4);
    expect(monthlyRate(0)).toBe(0);
  });
});

describe('projectBalance', () => {
  it('começa no mês 0 com o saldo inicial e sem juros', () => {
    const series = projectBalance({
      initial: 1000,
      monthlyContribution: 100,
      annualRate: 0.1,
      months: 12,
    });
    expect(series).toHaveLength(13);
    expect(series[0]).toEqual({ month: 0, contributed: 0, interest: 0, balance: 1000 });
  });

  it('sem rendimento, o saldo é só inicial + aportes', () => {
    const series = projectBalance({
      initial: 500,
      monthlyContribution: 250,
      annualRate: 0,
      months: 4,
    });
    expect(series.at(-1)).toEqual({ month: 4, contributed: 1000, interest: 0, balance: 1500 });
  });

  it('juros compostos batem com o valor futuro fechado', () => {
    const input = { initial: 1000, monthlyContribution: 300, annualRate: 0.12, months: 24 };
    expect(projectBalance(input).at(-1)?.balance).toBeCloseTo(futureValue(input), 1);
  });

  it('aporte entra no fim do mês (não rende no próprio mês)', () => {
    const [, first] = projectBalance({
      initial: 1000,
      monthlyContribution: 100,
      annualRate: 0.1268,
      months: 1,
    });
    // 1000 * 1,01 + 100 = 1110
    expect(first?.balance).toBeCloseTo(1110, 0);
  });
});

describe('monthsToTarget', () => {
  it('devolve 0 quando a meta já está atingida', () => {
    expect(monthsToTarget({ initial: 5000, monthlyContribution: 0, annualRate: 0, target: 5000 })).toBe(0);
  });

  it('conta os meses no caso sem rendimento', () => {
    expect(
      monthsToTarget({ initial: 0, monthlyContribution: 500, annualRate: 0, target: 5000 }),
    ).toBe(10);
  });

  it('chega mais rápido com rendimento do que sem', () => {
    const semJuros = monthsToTarget({ initial: 0, monthlyContribution: 500, annualRate: 0, target: 60_000 });
    const comJuros = monthsToTarget({ initial: 0, monthlyContribution: 500, annualRate: 0.12, target: 60_000 });
    expect(comJuros).not.toBeNull();
    expect(comJuros as number).toBeLessThan(semJuros as number);
  });

  it('devolve null quando é inalcançável (sem aporte e sem juros)', () => {
    expect(
      monthsToTarget({ initial: 100, monthlyContribution: 0, annualRate: 0, target: 10_000 }),
    ).toBeNull();
  });
});

describe('requiredContribution', () => {
  it('divide linearmente quando não há rendimento', () => {
    expect(
      requiredContribution({ initial: 2000, annualRate: 0, months: 10, target: 12_000 }),
    ).toBe(1000);
  });

  it('é o aporte que faz o valor futuro bater a meta', () => {
    const pmt = requiredContribution({ initial: 5000, annualRate: 0.1, months: 36, target: 50_000 });
    expect(
      futureValue({ initial: 5000, monthlyContribution: pmt, annualRate: 0.1, months: 36 }),
    ).toBeCloseTo(50_000, 0);
  });

  it('devolve 0 quando o saldo inicial já cobre a meta', () => {
    expect(
      requiredContribution({ initial: 20_000, annualRate: 0.08, months: 12, target: 10_000 }),
    ).toBe(0);
  });

  it('sem prazo (0 meses) pede a diferença de uma vez', () => {
    expect(requiredContribution({ initial: 300, annualRate: 0.1, months: 0, target: 1000 })).toBe(700);
  });
});

describe('buildScenarios', () => {
  const input = { initial: 1000, monthlyContribution: 500, annualRate: 0.1, target: 50_000, months: 60 };

  it('devolve pessimista/base/otimista com ±2 p.p.', () => {
    const scenarios = buildScenarios(input);
    expect(scenarios.map((s) => s.name)).toEqual(['pessimista', 'base', 'otimista']);
    expect(scenarios.map((s) => s.annualRate)).toEqual([0.08, 0.1, 0.12]);
  });

  it('saldo cresce do pessimista para o otimista', () => {
    const [pior, base, melhor] = buildScenarios(input);
    expect(pior?.balance).toBeLessThan(base?.balance as number);
    expect(base?.balance).toBeLessThan(melhor?.balance as number);
  });

  it('nunca gera taxa negativa no pessimista', () => {
    const [pior] = buildScenarios({ ...input, annualRate: 0.01 });
    expect(pior?.annualRate).toBe(0);
  });
});
