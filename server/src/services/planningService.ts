import { fromPostgrest } from '../errors/postgrest.js';
import { scoreFinances, type FinanceScoreResult } from '../lib/financeScore.js';
import { monthRange } from '../lib/period.js';
import {
  buildScenarios,
  futureValue,
  monthsToTarget,
  projectBalance,
  requiredContribution,
  round2,
  type ProjectionPoint,
  type Scenario,
} from '../lib/projection.js';
import type { UserClient } from '../lib/supabase.js';
import * as goalsService from './goalsService.js';
import { getPeriodSummary, type PeriodSummary } from './summaryService.js';

/**
 * Monta a tela de Planejamento: projeção por meta + score de saúde financeira.
 * Toda a matemática vive em lib/projection.ts e lib/financeScore.ts (puras);
 * aqui só buscamos as linhas e juntamos os números.
 */

/** Tipos de ativo que contam como reserva de emergência (líquidos). */
const LIQUID_KINDS = new Set(['conta corrente', 'poupanca', 'investimentos']);

function normalizeKind(kind: string): string {
  return kind
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface GoalProjection {
  goal: goalsService.Goal;
  /** Fração concluída (0..1) do valor-alvo. */
  progress: number;
  /** null = inalcançável mantendo aporte e rentabilidade atuais. */
  monthsToTarget: number | null;
  /** Mês YYYY-MM estimado da conclusão; null quando inalcançável. */
  estimatedDate: string | null;
  /** Saldo projetado no fim do horizonte pedido. */
  projectedBalance: number;
  /** Com prazo definido: aporte necessário para bater a meta a tempo. */
  requiredMonthly: number | null;
  /** Meses até o prazo (null sem prazo definido; 0 se já passou). */
  monthsToDeadline: number | null;
  onTrack: boolean;
  series: ProjectionPoint[];
  scenarios: Scenario[];
}

export interface PlanningResult {
  month: string;
  horizon: number;
  summary: PeriodSummary;
  netWorth: number;
  reserve: number;
  score: FinanceScoreResult;
  goals: GoalProjection[];
  /** Soma dos aportes mensais declarados nas metas. */
  committedMonthly: number;
  /** Sobra do mês menos o que já está comprometido com metas. */
  freeMonthly: number;
}

/**
 * Meses cheios entre hoje e uma data YYYY-MM-DD (0 quando já passou).
 *
 * Contados no CALENDÁRIO: dividir dias por uma média de 30,4375 errava o
 * aniversário exato — um prazo de exatamente 1 ano aparecia como 11 meses.
 */
export function monthsUntil(target: string, today: Date): number {
  const [ys = '', ms = '', ds = ''] = target.split('-');
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);

  const deadline = Date.UTC(year, month - 1, day);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (deadline <= now) return 0;

  const months =
    (year - today.getUTCFullYear()) * 12 +
    (month - (today.getUTCMonth() + 1)) -
    (day < today.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

/** Soma `months` meses ao mês corrente e devolve YYYY-MM. */
function addMonths(from: Date, months: number): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1));
  return d.toISOString().slice(0, 7);
}

function projectGoal(
  goal: goalsService.Goal,
  horizon: number,
  today: Date,
): GoalProjection {
  const base = {
    initial: goal.current_amount,
    monthlyContribution: goal.monthly_contribution,
    annualRate: goal.annual_rate,
  };
  const months = monthsToTarget({ ...base, target: goal.target_amount });
  const monthsToDeadline = goal.target_date ? monthsUntil(goal.target_date, today) : null;

  const requiredMonthly =
    monthsToDeadline === null
      ? null
      : requiredContribution({
          initial: goal.current_amount,
          annualRate: goal.annual_rate,
          months: monthsToDeadline,
          target: goal.target_amount,
        });

  // Sem prazo, "no caminho" é simplesmente ser alcançável; com prazo, é chegar
  // antes dele (equivalente a já aportar o necessário).
  const onTrack =
    monthsToDeadline === null
      ? months !== null
      : months !== null && months <= monthsToDeadline;

  return {
    goal,
    progress: Math.min(1, goal.current_amount / goal.target_amount),
    monthsToTarget: months,
    estimatedDate: months === null ? null : addMonths(today, months),
    projectedBalance: futureValue({ ...base, months: horizon }),
    requiredMonthly,
    monthsToDeadline,
    onTrack,
    series: projectBalance({ ...base, months: horizon }),
    scenarios: buildScenarios({ ...base, target: goal.target_amount, months: horizon }),
  };
}

export async function getPlanning(
  db: UserClient,
  month: string,
  horizon: number,
  today: Date = new Date(),
): Promise<PlanningResult> {
  const range = monthRange(month);

  const [summary, goals, assets, budgets, spending] = await Promise.all([
    getPeriodSummary(db, range),
    goalsService.listGoals(db),
    fetchAssets(db),
    fetchBudgets(db),
    fetchSpendingRows(db, range),
  ]);

  let netWorth = 0;
  let reserve = 0;
  for (const asset of assets) {
    netWorth += asset.is_liability ? -asset.value : asset.value;
    if (!asset.is_liability && LIQUID_KINDS.has(normalizeKind(asset.kind))) {
      reserve += asset.value;
    }
  }

  const spentByCategory = new Map<string, number>();
  for (const row of spending) {
    if (row.type !== 'despesa') continue;
    spentByCategory.set(row.category, (spentByCategory.get(row.category) ?? 0) + row.amount);
  }
  const budgetsWithinLimit = budgets.filter(
    (b) => (spentByCategory.get(b.category) ?? 0) <= b.monthly_limit,
  ).length;

  const score = scoreFinances({
    receitas: summary.receitas,
    despesas: summary.despesas,
    fixos: summary.fixos,
    reserve: round2(reserve),
    budgetsTotal: budgets.length,
    budgetsWithinLimit,
  });

  const committedMonthly = round2(
    goals.reduce((sum, g) => sum + g.monthly_contribution, 0),
  );

  return {
    month,
    horizon,
    summary,
    netWorth: round2(netWorth),
    reserve: round2(reserve),
    score,
    goals: goals.map((goal) => projectGoal(goal, horizon, today)),
    committedMonthly,
    freeMonthly: round2(summary.saldo - committedMonthly),
  };
}

async function fetchAssets(db: UserClient) {
  const { data, error } = await db.from('assets').select('kind, value, is_liability');
  if (error) throw fromPostgrest(error);
  return data;
}

async function fetchBudgets(db: UserClient) {
  const { data, error } = await db.from('budgets').select('category, monthly_limit');
  if (error) throw fromPostgrest(error);
  return data;
}

async function fetchSpendingRows(db: UserClient, range: { from: string; to: string }) {
  const { data, error } = await db
    .from('transactions')
    .select('type, category, amount')
    .gte('occurred_on', range.from)
    .lte('occurred_on', range.to);
  if (error) throw fromPostgrest(error);
  return data;
}
