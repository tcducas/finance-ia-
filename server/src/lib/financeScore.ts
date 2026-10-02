/**
 * Score de saúde financeira (0..100) — Fase 2 / v0.5.
 *
 * Função PURA e determinística, no mesmo espírito do riskScore do onboarding:
 * a IA nunca decide o score, ela só explica o número. Quatro pilares somam 100:
 *
 *   taxa de poupança .... 40 pts (cheio em >= 30% da renda sobrando)
 *   reserva de emergência 30 pts (cheio em >= 6 meses de despesa coberta)
 *   peso dos fixos ...... 20 pts (cheio em <= 50% da renda comprometida)
 *   adesão ao orçamento . 10 pts (proporção de categorias dentro do limite)
 *
 * Sem renda no mês, os pilares que dependem dela ficam em 0 e `partial: true`
 * avisa a UI de que o número ainda não é representativo.
 */

export interface FinanceScoreInput {
  receitas: number;
  despesas: number;
  /** Despesas recorrentes (aluguel, assinaturas…). */
  fixos: number;
  /** Patrimônio líquido de curto prazo disponível como reserva. */
  reserve: number;
  /** Categorias com orçamento definido e quantas ficaram dentro do limite. */
  budgetsTotal: number;
  budgetsWithinLimit: number;
}

export type ScoreBand = 'atencao' | 'razoavel' | 'saudavel';

export interface ScorePillar {
  id: 'poupanca' | 'reserva' | 'fixos' | 'orcamento';
  label: string;
  points: number;
  max: number;
  /** Frase curta e factual — a UI mostra, a IA pode reaproveitar. */
  detail: string;
}

export interface FinanceScoreResult {
  score: number;
  band: ScoreBand;
  pillars: ScorePillar[];
  savingsRate: number;
  emergencyMonths: number;
  /** true quando faltam dados (sem receita no mês) para um score confiável. */
  partial: boolean;
}

const MAX = { poupanca: 40, reserva: 30, fixos: 20, orcamento: 10 } as const;

/** Regra de três com teto — mantém cada pilar entre 0 e seu máximo. */
function scale(value: number, full: number, max: number): number {
  if (full <= 0) return max;
  return Math.max(0, Math.min(max, (value / full) * max));
}

export function scoreFinances(input: FinanceScoreInput): FinanceScoreResult {
  const { receitas, despesas, fixos, reserve, budgetsTotal, budgetsWithinLimit } = input;
  const hasIncome = receitas > 0;

  const savingsRate = hasIncome ? (receitas - despesas) / receitas : 0;
  const emergencyMonths = despesas > 0 ? reserve / despesas : reserve > 0 ? 6 : 0;
  const fixedRatio = hasIncome ? fixos / receitas : 1;

  const poupanca = hasIncome ? scale(Math.max(0, savingsRate), 0.3, MAX.poupanca) : 0;
  const reservaPts = scale(emergencyMonths, 6, MAX.reserva);
  // Quanto MENOS comprometido, mais ponto: 50% de fixos ou menos leva o máximo.
  const fixosPts = hasIncome
    ? scale(Math.max(0, 1 - Math.max(0, fixedRatio - 0.5) / 0.5), 1, MAX.fixos)
    : 0;
  const orcamentoPts =
    budgetsTotal > 0 ? scale(budgetsWithinLimit, budgetsTotal, MAX.orcamento) : 0;

  const pillars: ScorePillar[] = [
    {
      id: 'poupanca',
      label: 'Taxa de poupança',
      points: Math.round(poupanca),
      max: MAX.poupanca,
      detail: hasIncome
        ? `${(savingsRate * 100).toFixed(0)}% da renda sobrou no mês`
        : 'Sem receita lançada no mês',
    },
    {
      id: 'reserva',
      label: 'Reserva de emergência',
      points: Math.round(reservaPts),
      max: MAX.reserva,
      detail:
        despesas > 0
          ? `${emergencyMonths.toFixed(1)} meses de despesa cobertos`
          : 'Sem despesa lançada para comparar',
    },
    {
      id: 'fixos',
      label: 'Peso dos gastos fixos',
      points: Math.round(fixosPts),
      max: MAX.fixos,
      detail: hasIncome
        ? `${(fixedRatio * 100).toFixed(0)}% da renda comprometida com fixos`
        : 'Sem receita lançada no mês',
    },
    {
      id: 'orcamento',
      label: 'Adesão ao orçamento',
      points: Math.round(orcamentoPts),
      max: MAX.orcamento,
      detail:
        budgetsTotal > 0
          ? `${budgetsWithinLimit} de ${budgetsTotal} categorias dentro do limite`
          : 'Nenhum orçamento definido ainda',
    },
  ];

  const score = Math.max(0, Math.min(100, pillars.reduce((sum, p) => sum + p.points, 0)));
  const band: ScoreBand = score >= 70 ? 'saudavel' : score >= 40 ? 'razoavel' : 'atencao';

  return {
    score,
    band,
    pillars,
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    emergencyMonths: Math.round(emergencyMonths * 10) / 10,
    partial: !hasIncome,
  };
}
