/**
 * Motor de projeção de metas — juros compostos com aporte mensal.
 *
 * Funções PURAS: sem I/O, sem data do sistema, sem Supabase. É o que torna o
 * Planejamento testável e o mesmo número reproduzível no client, na API e no
 * prompt da IA. Convenções:
 *  - `annualRate` é decimal (0.105 = 10,5% a.a.), nunca percentual.
 *  - O aporte entra no FIM de cada mês (ordinary annuity) — o mês 1 já rende
 *    sobre o saldo inicial, mas não sobre o aporte do próprio mês.
 */

/** Teto de iteração: 100 anos. Além disso a meta é tratada como inalcançável. */
const MAX_MONTHS = 1200;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Taxa mensal equivalente à anual (capitalização composta, não /12). */
export function monthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

export interface ProjectionInput {
  /** Quanto já está guardado hoje. */
  initial: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
}

export interface ProjectionPoint {
  /** 0 = hoje. */
  month: number;
  /** Aportado acumulado (sem o saldo inicial). */
  contributed: number;
  /** Juros acumulados. */
  interest: number;
  balance: number;
}

/** Série mês a mês do saldo projetado, incluindo o mês 0 (hoje). */
export function projectBalance(input: ProjectionInput): ProjectionPoint[] {
  const { initial, monthlyContribution, annualRate } = input;
  const months = Math.max(0, Math.min(Math.trunc(input.months), MAX_MONTHS));
  const i = monthlyRate(annualRate);

  const series: ProjectionPoint[] = [
    { month: 0, contributed: 0, interest: 0, balance: round2(initial) },
  ];

  let balance = initial;
  let contributed = 0;
  for (let m = 1; m <= months; m += 1) {
    balance = balance * (1 + i) + monthlyContribution;
    contributed += monthlyContribution;
    series.push({
      month: m,
      contributed: round2(contributed),
      interest: round2(balance - initial - contributed),
      balance: round2(balance),
    });
  }
  return series;
}

/** Saldo projetado em `months` meses, sem materializar a série. */
export function futureValue(input: ProjectionInput): number {
  const { initial, monthlyContribution, annualRate } = input;
  const months = Math.max(0, Math.min(Math.trunc(input.months), MAX_MONTHS));
  const i = monthlyRate(annualRate);
  if (i === 0) return round2(initial + monthlyContribution * months);
  const growth = (1 + i) ** months;
  return round2(initial * growth + monthlyContribution * ((growth - 1) / i));
}

export interface TargetInput {
  initial: number;
  monthlyContribution: number;
  annualRate: number;
  target: number;
}

/**
 * Meses até atingir a meta. `null` quando é inalcançável no horizonte de 100
 * anos — o caso real de "aporte zero e sem rendimento", que a UI precisa
 * mostrar como tal em vez de um número gigante.
 */
export function monthsToTarget({
  initial,
  monthlyContribution,
  annualRate,
  target,
}: TargetInput): number | null {
  if (initial >= target) return 0;
  const i = monthlyRate(annualRate);
  if (i <= 0 && monthlyContribution <= 0) return null;

  let balance = initial;
  for (let m = 1; m <= MAX_MONTHS; m += 1) {
    const next = balance * (1 + i) + monthlyContribution;
    // Saldo parado (ou caindo) não chega a lugar nenhum: evita loop inútil.
    if (next <= balance) return null;
    balance = next;
    if (balance >= target) return m;
  }
  return null;
}

export interface RequiredContributionInput {
  initial: number;
  annualRate: number;
  months: number;
  target: number;
}

/** Aporte mensal necessário para bater a meta no prazo dado (0 se já basta). */
export function requiredContribution({
  initial,
  annualRate,
  months,
  target,
}: RequiredContributionInput): number {
  const n = Math.trunc(months);
  if (n <= 0) return round2(Math.max(0, target - initial));

  const i = monthlyRate(annualRate);
  if (i === 0) return round2(Math.max(0, (target - initial) / n));

  const growth = (1 + i) ** n;
  const pmt = ((target - initial * growth) * i) / (growth - 1);
  return round2(Math.max(0, pmt));
}

export type ScenarioName = 'pessimista' | 'base' | 'otimista';

export interface Scenario {
  name: ScenarioName;
  annualRate: number;
  /** Saldo projetado no horizonte pedido. */
  balance: number;
  monthsToTarget: number | null;
}

/** Variação de ±2 p.p. na rentabilidade — o "e se" da tela de Planejamento. */
export const SCENARIO_SPREAD = 0.02;

export function buildScenarios(
  input: TargetInput & { months: number },
): Scenario[] {
  const rates: Array<[ScenarioName, number]> = [
    ['pessimista', Math.max(0, input.annualRate - SCENARIO_SPREAD)],
    ['base', input.annualRate],
    ['otimista', input.annualRate + SCENARIO_SPREAD],
  ];

  return rates.map(([name, annualRate]) => ({
    name,
    annualRate: Math.round(annualRate * 10000) / 10000,
    balance: futureValue({
      initial: input.initial,
      monthlyContribution: input.monthlyContribution,
      annualRate,
      months: input.months,
    }),
    monthsToTarget: monthsToTarget({
      initial: input.initial,
      monthlyContribution: input.monthlyContribution,
      annualRate,
      target: input.target,
    }),
  }));
}
