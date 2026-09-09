import { AlertTriangle, CheckCircle2, CircleAlert, Trash2 } from 'lucide-react';
import { categoryColor, categoryLabel } from '../../lib/categories';
import { formatCurrency } from '../../lib/format';
import type { Budget } from '../../types/finance';

export type BudgetState = 'abaixo' | 'perto' | 'acima';

export function budgetState(spent: number, limit: number): BudgetState {
  const ratio = spent / limit;
  if (ratio >= 1) return 'acima';
  if (ratio >= 0.8) return 'perto';
  return 'abaixo';
}

const STATE_META: Record<
  BudgetState,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  abaixo: { label: 'Dentro do limite', color: 'var(--status-good)', icon: CheckCircle2 },
  perto: { label: 'Perto do limite', color: 'var(--status-warn)', icon: CircleAlert },
  acima: { label: 'Limite estourado', color: 'var(--status-bad)', icon: AlertTriangle },
};

interface BudgetRowProps {
  budget: Budget;
  spent: number;
  onRemove(id: string): void;
}

/** Barra gasto/limite com estado abaixo/perto/acima — ícone + texto, nunca só cor. */
export function BudgetRow({ budget, spent, onRemove }: BudgetRowProps) {
  const state = budgetState(spent, budget.monthly_limit);
  const meta = STATE_META[state];
  const Icon = meta.icon;
  const ratio = Math.min(spent / budget.monthly_limit, 1);
  const percent = Math.round((spent / budget.monthly_limit) * 100);

  return (
    <li className="group rounded-2xl border border-line bg-elevated px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(budget.category) }}
          aria-hidden
        />
        <p className="flex-1 truncate text-sm font-medium">{categoryLabel(budget.category)}</p>
        <p className="text-xs text-ink-muted tabular-nums">
          {formatCurrency(spent)} de {formatCurrency(budget.monthly_limit)}
        </p>
        <button
          type="button"
          onClick={() => onRemove(budget.id)}
          aria-label={`Remover orçamento de ${categoryLabel(budget.category)}`}
          className="grid size-7 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--status-bad)]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${categoryLabel(budget.category)}: ${percent}% do limite`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-line/70"
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${ratio * 100}%`, backgroundColor: meta.color }}
        />
      </div>

      <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: meta.color }}>
        <Icon className="size-3.5" aria-hidden />
        {meta.label} · {percent}%
      </p>
    </li>
  );
}
