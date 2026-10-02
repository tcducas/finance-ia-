import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';

/**
 * Ativação guiada — some quando os três primeiros passos estão cumpridos,
 * para a home não nascer vazia depois do onboarding.
 */
export function ActivationChecklist() {
  const { transactions, budgets, assets, loading, openTransactionForm } = useFinance();
  if (loading) return null;

  const steps = [
    {
      done: transactions.length > 0,
      label: 'Registrar sua primeira movimentação',
      action: (
        <button
          type="button"
          onClick={openTransactionForm}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-on-gold hover:bg-gold-strong"
        >
          <Plus className="size-3.5" aria-hidden />
          Adicionar
        </button>
      ),
    },
    {
      done: budgets.length > 0,
      label: 'Definir o primeiro limite de orçamento',
      action: <StepLink to="/app/gastos" label="Ir para Gastos" />,
    },
    {
      done: assets.length > 0,
      label: 'Cadastrar ou importar sua carteira',
      action: <StepLink to="/app/investimentos" label="Ir para Investimentos" />,
    },
  ];

  if (steps.every((s) => s.done)) return null;

  return (
    <div className="rounded-2xl border border-line bg-elevated p-5">
      <h3 className="text-sm font-semibold">Comece por aqui</h3>
      <p className="mt-0.5 text-xs text-ink-muted">
        Três passos rápidos para o Aura trabalhar com seus dados.
      </p>
      <ul className="mt-4 space-y-2.5">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2 className="size-4 text-gold" aria-hidden />
              ) : (
                <Circle className="size-4 text-ink-muted" aria-hidden />
              )}
              <span className={step.done ? 'text-ink-muted line-through' : undefined}>
                {step.label}
              </span>
            </span>
            {!step.done && step.action}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-line px-3 py-1 text-xs font-medium transition-colors hover:border-gold hover:text-gold"
    >
      {label}
    </Link>
  );
}
