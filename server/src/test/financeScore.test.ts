import { describe, expect, it } from 'vitest';
import { scoreFinances } from '../lib/financeScore.js';

const base = {
  receitas: 10_000,
  despesas: 7000,
  fixos: 4000,
  reserve: 42_000,
  budgetsTotal: 4,
  budgetsWithinLimit: 4,
};

describe('scoreFinances', () => {
  it('dá nota alta para finanças saudáveis', () => {
    const result = scoreFinances(base);
    expect(result.score).toBe(100);
    expect(result.band).toBe('saudavel');
    expect(result.partial).toBe(false);
  });

  it('nunca passa de 100 nem cai abaixo de 0', () => {
    const acima = scoreFinances({ ...base, receitas: 20_000, despesas: 1000, reserve: 1_000_000 });
    expect(acima.score).toBeLessThanOrEqual(100);
    const abaixo = scoreFinances({
      receitas: 3000,
      despesas: 6000,
      fixos: 6000,
      reserve: 0,
      budgetsTotal: 2,
      budgetsWithinLimit: 0,
    });
    expect(abaixo.score).toBeGreaterThanOrEqual(0);
    expect(abaixo.band).toBe('atencao');
  });

  it('marca partial e zera os pilares de renda quando não há receita', () => {
    const result = scoreFinances({ ...base, receitas: 0 });
    expect(result.partial).toBe(true);
    const byId = new Map(result.pillars.map((p) => [p.id, p.points]));
    expect(byId.get('poupanca')).toBe(0);
    expect(byId.get('fixos')).toBe(0);
  });

  it('reserva cheia em 6 meses de despesa', () => {
    const seis = scoreFinances({ ...base, reserve: 7000 * 6 });
    const tres = scoreFinances({ ...base, reserve: 7000 * 3 });
    expect(seis.emergencyMonths).toBe(6);
    const pts = (r: typeof seis) => r.pillars.find((p) => p.id === 'reserva')?.points;
    expect(pts(seis)).toBe(30);
    expect(pts(tres)).toBe(15);
  });

  it('pontua orçamento pela proporção dentro do limite', () => {
    const metade = scoreFinances({ ...base, budgetsTotal: 4, budgetsWithinLimit: 2 });
    expect(metade.pillars.find((p) => p.id === 'orcamento')?.points).toBe(5);
  });

  it('sem orçamento definido, o pilar fica em 0 (e o score não passa de 90)', () => {
    const semOrcamento = scoreFinances({ ...base, budgetsTotal: 0, budgetsWithinLimit: 0 });
    expect(semOrcamento.pillars.find((p) => p.id === 'orcamento')?.points).toBe(0);
    expect(semOrcamento.score).toBe(90);
  });

  it('gastos fixos acima de 100% da renda zeram o pilar de fixos', () => {
    const result = scoreFinances({ ...base, fixos: 11_000 });
    expect(result.pillars.find((p) => p.id === 'fixos')?.points).toBe(0);
  });

  it('a soma dos pilares é o score', () => {
    const result = scoreFinances({ ...base, despesas: 8500, reserve: 10_000, budgetsWithinLimit: 1 });
    expect(result.pillars.reduce((s, p) => s + p.points, 0)).toBe(result.score);
  });
});
