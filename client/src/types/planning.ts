// Espelham o contrato de /api/goals e /api/planning (server/src/services/planningService.ts).

export type GoalKind = 'reserva' | 'compra' | 'aposentadoria' | 'geral';

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  /** Decimal: 0.105 = 10,5% a.a. */
  annual_rate: number;
  target_date: string | null;
  priority: number;
  created_at: string;
}

export interface GoalInput {
  name: string;
  kind?: GoalKind;
  target_amount: number;
  current_amount?: number;
  monthly_contribution?: number;
  annual_rate?: number;
  target_date?: string | null;
  priority?: number;
}

export interface ProjectionPoint {
  month: number;
  contributed: number;
  interest: number;
  balance: number;
}

export type ScenarioName = 'pessimista' | 'base' | 'otimista';

export interface Scenario {
  name: ScenarioName;
  annualRate: number;
  balance: number;
  monthsToTarget: number | null;
}

export interface GoalProjection {
  goal: Goal;
  progress: number;
  monthsToTarget: number | null;
  estimatedDate: string | null;
  projectedBalance: number;
  requiredMonthly: number | null;
  monthsToDeadline: number | null;
  onTrack: boolean;
  series: ProjectionPoint[];
  scenarios: Scenario[];
}

export type ScoreBand = 'atencao' | 'razoavel' | 'saudavel';

export interface ScorePillar {
  id: 'poupanca' | 'reserva' | 'fixos' | 'orcamento';
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface FinanceScore {
  score: number;
  band: ScoreBand;
  pillars: ScorePillar[];
  savingsRate: number;
  emergencyMonths: number;
  partial: boolean;
}

export interface Planning {
  month: string;
  horizon: number;
  summary: {
    receitas: number;
    despesas: number;
    saldo: number;
    fixos: number;
    variaveis: number;
  };
  netWorth: number;
  reserve: number;
  score: FinanceScore;
  goals: GoalProjection[];
  committedMonthly: number;
  freeMonthly: number;
}
