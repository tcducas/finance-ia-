import { describe, expect, it } from 'vitest';
import { monthsUntil } from '../services/planningService.js';

const hoje = new Date('2026-09-29T00:00:00Z');

describe('monthsUntil', () => {
  it('conta meses cheios até o prazo', () => {
    // Aniversário exato é 12 meses, não 11 — era o bug do divisor de dias médios.
    expect(monthsUntil('2027-09-29', hoje)).toBe(12);
    // 29/set a 29/dez são 3 meses de calendário; a conta antiga dava 2.
    expect(monthsUntil('2026-12-29', hoje)).toBe(3);
  });

  it('devolve 0 para prazo hoje ou no passado', () => {
    expect(monthsUntil('2026-09-29', hoje)).toBe(0);
    expect(monthsUntil('2020-01-01', hoje)).toBe(0);
  });

  it('não arredonda para cima um mês incompleto', () => {
    expect(monthsUntil('2026-10-20', hoje)).toBe(0);
    // 30 de outubro ainda não completa o mês que começou em 29 de setembro… completa.
    expect(monthsUntil('2026-10-30', hoje)).toBe(1);
  });
});
