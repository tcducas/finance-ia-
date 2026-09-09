import { fromPostgrest } from '../errors/postgrest.js';
import type { DateRange } from '../lib/period.js';
import type { UserClient } from '../lib/supabase.js';

export interface PeriodSummary {
  receitas: number;
  despesas: number;
  saldo: number;
  /** Despesas recorrentes (fixos) × não recorrentes (variáveis). */
  fixos: number;
  variaveis: number;
}

export interface CategorySpending {
  category: string;
  total: number;
}

export async function getPeriodSummary(db: UserClient, range: DateRange): Promise<PeriodSummary> {
  const rows = await fetchPeriodRows(db, range);

  let receitas = 0;
  let despesas = 0;
  let fixos = 0;
  for (const row of rows) {
    if (row.type === 'receita') {
      receitas += row.amount;
    } else {
      despesas += row.amount;
      if (row.is_recurring) fixos += row.amount;
    }
  }

  return {
    receitas: round2(receitas),
    despesas: round2(despesas),
    saldo: round2(receitas - despesas),
    fixos: round2(fixos),
    variaveis: round2(despesas - fixos),
  };
}

/** Gastos (despesas) agregados por categoria, do maior para o menor. */
export async function getSpendingByCategory(
  db: UserClient,
  range: DateRange,
): Promise<CategorySpending[]> {
  const rows = await fetchPeriodRows(db, range);

  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.type !== 'despesa') continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount);
  }

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

async function fetchPeriodRows(db: UserClient, range: DateRange) {
  const { data, error } = await db
    .from('transactions')
    .select('type, category, amount, is_recurring')
    .gte('occurred_on', range.from)
    .lte('occurred_on', range.to);
  if (error) throw fromPostgrest(error);
  return data;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
