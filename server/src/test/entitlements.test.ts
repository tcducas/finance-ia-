import { describe, expect, it } from 'vitest';
import {
  aiLimitFor,
  aiQuotaExceeded,
  allowedIntervals,
  allowsMarket,
  clampEvolutionMonths,
  entitlementsFor,
  isPlan,
  planFrom,
  usagePeriod,
} from '../lib/entitlements.js';

describe('planFrom / isPlan', () => {
  it('aceita só os planos conhecidos', () => {
    expect(isPlan('free')).toBe(true);
    expect(isPlan('pro')).toBe(true);
    expect(isPlan('enterprise')).toBe(false);
  });

  it('valor desconhecido cai em free, nunca em pro', () => {
    expect(planFrom('pro')).toBe('pro');
    expect(planFrom('vip')).toBe('free');
    expect(planFrom(null)).toBe('free');
    expect(planFrom(undefined)).toBe('free');
  });
});

describe('allowsMarket', () => {
  it('free tem B3 e cripto, não tem internacional', () => {
    expect(allowsMarket('free', 'BR')).toBe(true);
    expect(allowsMarket('free', 'CRYPTO')).toBe(true);
    expect(allowsMarket('free', 'US')).toBe(false);
  });

  it('pro tem os três', () => {
    for (const market of ['BR', 'CRYPTO', 'US'] as const) {
      expect(allowsMarket('pro', market)).toBe(true);
    }
  });
});

describe('allowedIntervals', () => {
  const cryptoSource = ['15m', '1h', '4h', '1d'];

  it('free fica só no diário', () => {
    expect(allowedIntervals('free', 'CRYPTO', cryptoSource)).toEqual(['1d']);
  });

  it('pro recebe todos os que a fonte entrega', () => {
    expect(allowedIntervals('pro', 'CRYPTO', cryptoSource)).toEqual(cryptoSource);
  });

  it('nunca devolve vazio: sem interseção, fica o primeiro da fonte', () => {
    // O free não libera nenhum período de US, mas a lista não pode ficar vazia
    // ou o board abriria sem nenhum botão de período.
    expect(allowedIntervals('free', 'US', ['60', 'D', 'W'])).toEqual(['60']);
  });

  it('fonte sem períodos devolve lista vazia', () => {
    expect(allowedIntervals('pro', 'BR', [])).toEqual([]);
  });

  it('ignora período que o plano libera mas a fonte não tem', () => {
    expect(allowedIntervals('pro', 'BR', ['1d'])).toEqual(['1d']);
  });
});

describe('livro de ofertas', () => {
  it('é exclusivo do pro', () => {
    expect(entitlementsFor('free').book).toBe(false);
    expect(entitlementsFor('pro').book).toBe(true);
  });
});

describe('clampEvolutionMonths', () => {
  it('free não passa de 6 meses', () => {
    expect(clampEvolutionMonths('free', 24)).toBe(6);
    expect(clampEvolutionMonths('free', 3)).toBe(3);
  });

  it('pro não passa de 24 meses', () => {
    expect(clampEvolutionMonths('pro', 12)).toBe(12);
    expect(clampEvolutionMonths('pro', 60)).toBe(24);
  });
});

describe('cotas de IA', () => {
  it('free tem limite, pro é ilimitado', () => {
    expect(aiLimitFor('free', 'chat')).toBe(10);
    expect(aiLimitFor('free', 'analyze')).toBe(2);
    expect(aiLimitFor('pro', 'chat')).toBeNull();
    expect(aiLimitFor('pro', 'analyze')).toBeNull();
  });

  it('estoura exatamente no limite, não depois', () => {
    expect(aiQuotaExceeded('free', 'chat', 9)).toBe(false);
    expect(aiQuotaExceeded('free', 'chat', 10)).toBe(true);
    expect(aiQuotaExceeded('free', 'analyze', 2)).toBe(true);
  });

  it('pro nunca estoura', () => {
    expect(aiQuotaExceeded('pro', 'chat', 10_000)).toBe(false);
  });

  it('chat agrega por dia e análise por mês', () => {
    const now = new Date('2026-10-01T15:30:00Z');
    expect(usagePeriod('chat', now)).toBe('2026-10-01');
    expect(usagePeriod('analyze', now)).toBe('2026-10');
  });
});

describe('o plano free continua útil', () => {
  it('mantém mercado nacional, metas e evolução de 6 meses', () => {
    const free = entitlementsFor('free');
    expect(free.markets).toContain('BR');
    expect(free.markets).toContain('CRYPTO');
    expect(free.evolutionMonths).toBeGreaterThanOrEqual(6);
    // Metas e projeções não são limitadas por plano, de propósito.
    expect(free).not.toHaveProperty('maxGoals');
  });
});
