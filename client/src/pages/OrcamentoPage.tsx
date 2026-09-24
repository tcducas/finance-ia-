import { ChartPie, Plus } from 'lucide-react';
import { useState } from 'react';
import { BudgetForm } from '../components/budget/BudgetForm';
import { BudgetRow } from '../components/budget/BudgetRow';
import { SpendingAnalysis } from '../components/budget/SpendingAnalysis';
import { CopilotInsightCard } from '../components/copilot/CopilotInsightCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useFinance } from '../context/FinanceContext';

/**
 * Tela: Gastos — rota `/app/gastos`
 * Menu: "Gastos" (2º item)
 * Orçamento por categoria, análise de gastos e alertas do copiloto.
 */
export function OrcamentoPage() {
  const { budgets, spending, loading, removeBudget } = useFinance();
  const [formOpen, setFormOpen] = useState(false);

  const spentByCategory = new Map(spending.map((s) => [s.category, s.total]));

  return (
    <section aria-labelledby="gastos-titulo" className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="gastos-titulo" className="text-2xl font-bold tracking-tight">
            Gastos
          </h2>
          <p className="text-sm text-ink-muted">
            Orçamento por categoria, análise e alertas do copiloto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="size-4" aria-hidden />
          Definir orçamento
        </button>
      </div>

      <CopilotInsightCard />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Orçamento do mês
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={ChartPie}
            title="Sem orçamento definido"
            description="Defina um limite mensal por categoria — “gastei 640 no mercado” vira “gastei 640 dos 800 que planejei”."
          />
        ) : (
          <ul className="space-y-2" aria-label="Orçamentos por categoria">
            {budgets.map((budget) => (
              <BudgetRow
                key={budget.id}
                budget={budget}
                spent={spentByCategory.get(budget.category) ?? 0}
                onRemove={(id) => void removeBudget(id)}
              />
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Análise de gastos
        </h3>
        <SpendingAnalysis />
      </div>

      <BudgetForm open={formOpen} onClose={() => setFormOpen(false)} />
    </section>
  );
}
