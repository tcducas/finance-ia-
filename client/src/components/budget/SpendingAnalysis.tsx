import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { categoryColor, categoryLabel } from '../../lib/categories';
import { formatCurrency } from '../../lib/format';
import { getProvider } from '../../services/data';
import type { CategorySpending } from '../../types/finance';

function previousMonth(month: string): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const date = new Date(Date.UTC(Number(y), Number(m) - 2, 1));
  return date.toISOString().slice(0, 7);
}

/** Breakdown por categoria + comparação com o mês anterior. */
export function SpendingAnalysis() {
  const { month, spending, summary } = useFinance();
  const [previous, setPrevious] = useState<CategorySpending[] | null>(null);

  useEffect(() => {
    let active = true;
    const prev = previousMonth(month);
    getProvider()
      .listTransactions(prev)
      .then((rows) => {
        if (!active) return;
        const totals = new Map<string, number>();
        for (const t of rows) {
          if (t.type !== 'despesa') continue;
          totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
        }
        setPrevious([...totals.entries()].map(([category, total]) => ({ category, total })));
      })
      .catch(() => setPrevious([]));
    return () => {
      active = false;
    };
  }, [month]);

  const rows = useMemo(() => {
    const prevMap = new Map((previous ?? []).map((s) => [s.category, s.total]));
    return spending.map((s) => {
      const before = prevMap.get(s.category) ?? 0;
      const delta = before > 0 ? ((s.total - before) / before) * 100 : null;
      return { ...s, before, delta };
    });
  }, [spending, previous]);

  if (spending.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
        Sem gastos neste mês — a análise aparece junto com as movimentações.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5" aria-label="Gastos por categoria comparados ao mês anterior">
        {rows.map((row) => {
          const share = summary.despesas > 0 ? Math.round((row.total / summary.despesas) * 100) : 0;
          return (
            <li
              key={row.category}
              className="flex items-center gap-2 rounded-xl border border-line bg-elevated px-3 py-2 text-sm"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor(row.category) }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{categoryLabel(row.category)}</span>
              <span className="text-xs text-ink-muted tabular-nums">{share}%</span>
              <span className="w-24 text-right font-medium tabular-nums">
                {formatCurrency(row.total)}
              </span>
              <span
                className="flex w-20 items-center justify-end gap-0.5 text-xs tabular-nums"
                title="Variação vs mês anterior"
                style={{
                  color:
                    row.delta === null
                      ? 'var(--ink-muted)'
                      : row.delta > 0
                        ? 'var(--status-bad)'
                        : 'var(--status-good)',
                }}
              >
                {row.delta === null ? (
                  <>
                    <Minus className="size-3" aria-hidden /> novo
                  </>
                ) : row.delta > 0 ? (
                  <>
                    <ArrowUpRight className="size-3" aria-hidden />+{Math.round(row.delta)}%
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="size-3" aria-hidden />
                    {Math.round(row.delta)}%
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink-muted">
        Variação comparada ao mês anterior; “novo” = categoria sem gasto no mês passado.
      </p>
    </div>
  );
}
