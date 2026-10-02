import { ArrowDownRight, ArrowUpRight, Repeat, Trash2, Wallet } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { categoryColor, categoryLabel } from '../../lib/categories';
import { formatCurrency, formatDayMonth } from '../../lib/format';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';

export function TransactionList() {
  const { transactions, loading, removeTransaction, openTransactionForm } = useFinance();

  if (loading) {
    return <Skeleton className="h-16" rows={3} />;
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sem movimentações neste mês"
        description="Use o botão “Nova” (ou o “+”) para lançar a primeira entrada ou saída."
      />
    );
  }

  return (
    <ul className="space-y-2" aria-label="Movimentações do mês">
      {transactions.map((t) => {
        const isIncome = t.type === 'receita';
        return (
          <li
            key={t.id}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3 shadow-sm"
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
              aria-hidden
            >
              {isIncome ? (
                <ArrowUpRight className="size-5" style={{ color: 'var(--status-good)' }} />
              ) : (
                <ArrowDownRight className="size-5" style={{ color: 'var(--status-bad)' }} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryColor(t.category) }}
                  aria-hidden
                />
                {categoryLabel(t.category)}
                {t.is_recurring && (
                  <span title="Recorrente" className="text-ink-muted">
                    <Repeat className="size-3.5" aria-label="Recorrente" />
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {formatDayMonth(t.occurred_on)}
                {t.description ? ` · ${t.description}` : ''}
              </p>
            </div>

            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: isIncome ? 'var(--status-good)' : undefined }}
            >
              {isIncome ? '+' : '−'}
              {formatCurrency(t.amount)}
            </p>

            <button
              type="button"
              onClick={() => void removeTransaction(t.id)}
              aria-label={`Remover ${categoryLabel(t.category)} de ${formatCurrency(t.amount)}`}
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--status-bad)]"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
