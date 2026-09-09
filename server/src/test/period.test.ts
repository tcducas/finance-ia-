import { describe, expect, it } from 'vitest';
import { monthRange, monthSchema } from '../lib/period.js';

describe('monthRange', () => {
  it('cobre um mês de 31 dias', () => {
    expect(monthRange('2026-07')).toEqual({ from: '2026-07-01', to: '2026-07-31' });
  });

  it('cobre fevereiro comum e bissexto', () => {
    expect(monthRange('2026-02').to).toBe('2026-02-28');
    expect(monthRange('2028-02').to).toBe('2028-02-29');
  });

  it('cobre um mês de 30 dias', () => {
    expect(monthRange('2026-04').to).toBe('2026-04-30');
  });
});

describe('monthSchema', () => {
  it('aceita YYYY-MM válido', () => {
    expect(monthSchema.safeParse('2026-12').success).toBe(true);
  });

  it('rejeita mês 13 e formatos errados', () => {
    expect(monthSchema.safeParse('2026-13').success).toBe(false);
    expect(monthSchema.safeParse('07-2026').success).toBe(false);
    expect(monthSchema.safeParse('2026-7').success).toBe(false);
  });
});
