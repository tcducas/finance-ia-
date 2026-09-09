import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { buildInsight } from '../../lib/insights';

/** Faixa do copiloto: lê os números da tela e propõe uma ação (regras locais). */
export function CopilotInsightCard() {
  const { summary, spending, budgets, loading } = useFinance();

  const insight = useMemo(
    () => (loading ? null : buildInsight(summary, spending, budgets)),
    [loading, budgets, spending, summary],
  );

  if (!insight) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/5 px-4 py-3">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
      <div>
        <p className="text-sm">{insight}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Observação educativa do copiloto — não é recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
