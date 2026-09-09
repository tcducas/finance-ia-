import { categoryLabel } from './categories';
import { formatCurrency } from './format';
import type { Budget, CategorySpending, PeriodSummary } from '../types/finance';

/**
 * Insight proativo derivado por regras locais dos dados da tela.
 * Compartilhado pela faixa do copiloto (CopilotInsightCard) e pelo drawer.
 */
export function buildInsight(
  summary: PeriodSummary,
  spending: CategorySpending[],
  budgets: Budget[],
): string {
  for (const budget of budgets) {
    const spent = spending.find((s) => s.category === budget.category)?.total ?? 0;
    const ratio = spent / budget.monthly_limit;
    if (ratio >= 1) {
      return `O orçamento de ${categoryLabel(budget.category)} estourou: ${formatCurrency(spent)} de ${formatCurrency(budget.monthly_limit)} planejados.`;
    }
    if (ratio >= 0.8) {
      return `${Math.round(ratio * 100)}% do orçamento de ${categoryLabel(budget.category)} já foi usado.`;
    }
  }

  const top = spending[0];
  if (top && summary.despesas > 0) {
    const share = Math.round((top.total / summary.despesas) * 100);
    if (share >= 30) {
      return `${categoryLabel(top.category)} concentra ${share}% dos seus gastos do mês (${formatCurrency(top.total)}).`;
    }
  }

  if (summary.saldo > 0 && summary.receitas > 0) {
    return `Saldo positivo de ${formatCurrency(summary.saldo)} até aqui — bom momento para planejar o aporte do mês.`;
  }

  if (summary.receitas === 0 && summary.despesas === 0) {
    return 'Lance suas primeiras movimentações e eu começo a acompanhar seu mês.';
  }

  return `Suas despesas somam ${formatCurrency(summary.despesas)} neste mês.`;
}
