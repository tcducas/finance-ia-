import type { RiskProfile } from './riskScore.js';

/**
 * Motor de análise de investimentos — funções PURAS, sem I/O.
 *
 * Implementa os métodos clássicos de análise de investimentos aplicados a uma
 * carteira: VPL, TIR, payback, concentração, volatilidade e alinhamento
 * estratégico. A IA nunca calcula nada disto — ela recebe os números prontos e
 * só explica. Número reproduzível, explicação variável.
 *
 * Uma observação honesta sobre o mapeamento: VPL/TIR/payback nasceram para
 * projetos (fluxo de caixa com investimento inicial). Aplicados a uma carteira,
 * o fluxo é: aportes como saídas, proventos como entradas e o valor de mercado
 * de hoje como valor terminal. Com isso a TIR é a rentabilidade ponderada pelo
 * tempo do dinheiro (money-weighted return), o VPL é quanto a carteira vale
 * acima da taxa de atratividade, e o payback é quando os proventos devolvem o
 * capital. São as mesmas fórmulas, com o fluxo montado explicitamente.
 */

export const ASSET_CLASSES = [
  'acao',
  'fii',
  'etf',
  'cripto',
  'renda_fixa',
  'internacional',
  'caixa',
  'outro',
] as const;

export type AssetClass = (typeof ASSET_CLASSES)[number];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  acao: 'Ações',
  fii: 'Fundos imobiliários',
  etf: 'ETFs',
  cripto: 'Cripto',
  renda_fixa: 'Renda fixa',
  internacional: 'Internacional',
  caixa: 'Caixa',
  outro: 'Outros',
};

export function isAssetClass(value: unknown): value is AssetClass {
  return typeof value === 'string' && (ASSET_CLASSES as readonly string[]).includes(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Fluxo de caixa: VPL, TIR, payback
// ---------------------------------------------------------------------------

export interface CashFlow {
  /** Meses desde o início do fluxo. 0 = hoje do ponto de vista do aporte. */
  month: number;
  /** Negativo = saída (aporte), positivo = entrada (provento, resgate). */
  amount: number;
}

/**
 * Valor Presente Líquido. `annualRate` é a taxa de atratividade (custo de
 * oportunidade) em decimal: 0.105 = 10,5% a.a. VPL positivo significa que o
 * fluxo rende acima dessa taxa.
 */
export function npv(annualRate: number, flows: CashFlow[]): number {
  const monthly = (1 + annualRate) ** (1 / 12) - 1;
  return round2(
    flows.reduce((sum, flow) => sum + flow.amount / (1 + monthly) ** flow.month, 0),
  );
}

const IRR_MAX_RATE = 100; // 10.000% a.a. — teto de busca, não expectativa.
const IRR_TOLERANCE = 1e-7;
const IRR_ITERATIONS = 200;

/**
 * Taxa Interna de Retorno anual: a taxa que zera o VPL. Resolvida por bisseção,
 * que converge sempre que há troca de sinal — mais robusta que Newton para
 * fluxos irregulares de carteira.
 *
 * `null` quando não existe TIR: fluxo sem troca de sinal (só aportes, ou só
 * entradas) não tem taxa de retorno definida, e devolver 0 nesse caso seria
 * mentir.
 */
export function irr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const hasOutflow = flows.some((f) => f.amount < 0);
  const hasInflow = flows.some((f) => f.amount > 0);
  if (!hasOutflow || !hasInflow) return null;

  let low = -0.9999;
  let high = IRR_MAX_RATE;
  const at = (rate: number) => npv(rate, flows);

  if (at(low) * at(high) > 0) return null;

  for (let i = 0; i < IRR_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const value = at(mid);
    if (Math.abs(value) < IRR_TOLERANCE) return Math.round(mid * 10000) / 10000;
    if (at(low) * value < 0) high = mid;
    else low = mid;
  }
  return Math.round(((low + high) / 2) * 10000) / 10000;
}

/**
 * Payback simples: em quantos meses as entradas acumuladas cobrem as saídas.
 * `null` quando o fluxo nunca se paga no horizonte informado — o caso comum de
 * uma carteira que ainda não distribuiu proventos suficientes.
 */
export function paybackMonths(flows: CashFlow[]): number | null {
  const ordered = [...flows].sort((a, b) => a.month - b.month);
  let balance = 0;
  for (const flow of ordered) {
    balance += flow.amount;
    if (balance >= 0 && flow.amount > 0) return flow.month;
  }
  return null;
}

/**
 * Payback por proventos recorrentes: quanto falta para os dividendos devolverem
 * o capital investido, no ritmo médio observado.
 */
export function paybackFromDividends(
  invested: number,
  dividendsReceived: number,
  monthsHeld: number,
): number | null {
  if (invested <= 0) return 0;
  if (dividendsReceived <= 0 || monthsHeld <= 0) return null;
  const monthlyAverage = dividendsReceived / monthsHeld;
  if (monthlyAverage <= 0) return null;
  return Math.ceil(invested / monthlyAverage);
}

// ---------------------------------------------------------------------------
// Risco: concentração e volatilidade
// ---------------------------------------------------------------------------

/**
 * Índice de Herfindahl-Hirschman das participações (0..1). Soma dos quadrados
 * dos pesos: 1 = tudo num só ativo, 1/n = perfeitamente distribuído.
 */
export function herfindahl(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;
  const hhi = weights.reduce((sum, w) => sum + (w / total) ** 2, 0);
  return Math.round(hhi * 10000) / 10000;
}

/** Nº de posições "efetivas": 1/HHI. Dez posições com HHI 0,5 valem 2. */
export function effectivePositions(weights: number[]): number {
  const hhi = herfindahl(weights);
  return hhi > 0 ? Math.round((1 / hhi) * 10) / 10 : 0;
}

export type ConcentrationLevel = 'diversificada' | 'moderada' | 'concentrada';

/** Faixas convencionais do HHI, adaptadas para carteira de pessoa física. */
export function concentrationLevel(hhi: number): ConcentrationLevel {
  if (hhi >= 0.25) return 'concentrada';
  if (hhi >= 0.15) return 'moderada';
  return 'diversificada';
}

/**
 * Volatilidade anualizada a partir de uma série de fechamentos diários.
 * Desvio-padrão dos retornos logarítmicos × √252 (dias úteis no ano).
 * `null` com menos de 3 pontos — desvio de 2 amostras não diz nada.
 */
export function annualizedVolatility(closes: number[]): number | null {
  const usable = closes.filter((c) => c > 0);
  if (usable.length < 3) return null;

  const returns: number[] = [];
  for (let i = 1; i < usable.length; i += 1) {
    const previous = usable[i - 1] as number;
    const current = usable[i] as number;
    returns.push(Math.log(current / previous));
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  const annual = Math.sqrt(variance) * Math.sqrt(252);
  return Math.round(annual * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Liquidez
// ---------------------------------------------------------------------------

export type LiquidityLevel = 'alta' | 'media' | 'baixa' | 'desconhecida';

/**
 * Liquidez pela razão entre a posição e o volume negociado no dia: quanto do
 * volume diário a posição representa. Posição que vale mais que 1% do giro
 * diário já pressiona o preço na saída.
 */
export function liquidityLevel(
  positionValue: number,
  dailyVolumeValue: number | null,
): LiquidityLevel {
  if (dailyVolumeValue === null || dailyVolumeValue <= 0) return 'desconhecida';
  const share = positionValue / dailyVolumeValue;
  if (share <= 0.001) return 'alta';
  if (share <= 0.01) return 'media';
  return 'baixa';
}

// ---------------------------------------------------------------------------
// Alinhamento estratégico
// ---------------------------------------------------------------------------

export type TargetAllocation = Partial<Record<AssetClass, number>>;

/**
 * Alocação-alvo por perfil. Referência EDUCATIVA, não recomendação: serve para
 * medir distância entre a carteira e um retrato típico do perfil. Cada coluna
 * soma 100.
 */
export const TARGET_ALLOCATION: Record<RiskProfile, TargetAllocation> = {
  conservador: { renda_fixa: 70, caixa: 10, fii: 10, acao: 10 },
  moderado: { renda_fixa: 45, acao: 25, internacional: 15, fii: 10, caixa: 5 },
  arrojado: { renda_fixa: 25, acao: 35, internacional: 20, fii: 10, cripto: 5, caixa: 5 },
};

export interface AllocationGap {
  assetClass: AssetClass;
  /** Percentual atual da carteira (0..100). */
  actual: number;
  target: number;
  /** actual − target. Positivo = acima do alvo. */
  gap: number;
}

/** Diferença entre a alocação atual e o alvo do perfil, classe por classe. */
export function allocationGaps(
  actual: Partial<Record<AssetClass, number>>,
  profile: RiskProfile,
): AllocationGap[] {
  const target = TARGET_ALLOCATION[profile];
  const classes = new Set<AssetClass>([
    ...(Object.keys(target) as AssetClass[]),
    ...(Object.keys(actual) as AssetClass[]),
  ]);

  return [...classes]
    .map((assetClass) => {
      const a = round2(actual[assetClass] ?? 0);
      const t = target[assetClass] ?? 0;
      return { assetClass, actual: a, target: t, gap: round2(a - t) };
    })
    .sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap));
}

/**
 * Score de alinhamento (0..100). Parte de 100 e desconta metade da distância
 * total absoluta: uma carteira perfeitamente alinhada soma 0 de desvio, e o
 * desvio máximo possível é 200 (100 a mais numa classe, 100 a menos noutra).
 */
export function alignmentScore(gaps: AllocationGap[]): number {
  const totalDeviation = gaps.reduce((sum, g) => sum + Math.abs(g.gap), 0);
  return Math.max(0, Math.round(100 - totalDeviation / 2));
}

// ---------------------------------------------------------------------------
// Panorama consolidado
// ---------------------------------------------------------------------------

export interface PositionInput {
  ticker: string;
  assetClass: AssetClass;
  quantity: number;
  avgPrice: number;
  /** Cotação atual; null quando o mercado não respondeu. */
  currentPrice: number | null;
  /** Volume financeiro negociado no dia, para a liquidez. */
  dailyVolumeValue: number | null;
  /** Série de fechamentos para a volatilidade. */
  closes: number[];
  acquiredOn: string | null;
  dividendsReceived: number;
}

export interface PositionMetrics {
  ticker: string;
  assetClass: AssetClass;
  quantity: number;
  avgPrice: number;
  currentPrice: number | null;
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: number | null;
  /** Peso na carteira (0..100). */
  weight: number;
  volatility: number | null;
  liquidity: LiquidityLevel;
  monthsHeld: number | null;
  /** Rentabilidade anualizada da posição; null sem data de aporte. */
  annualizedReturn: number | null;
  dividendYieldOnCost: number | null;
  paybackByDividends: number | null;
  /** true quando a cotação não veio e os números usam o preço médio. */
  priceStale: boolean;
}

export interface PortfolioMetrics {
  positions: PositionMetrics[];
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: number | null;
  /** Alocação atual por classe, em percentual. */
  allocation: Partial<Record<AssetClass, number>>;
  gaps: AllocationGap[];
  alignmentScore: number;
  hhi: number;
  effectivePositions: number;
  concentration: ConcentrationLevel;
  /** Volatilidade da carteira, ponderada pelo peso das posições. */
  portfolioVolatility: number | null;
  /** TIR da carteira montada como fluxo de caixa; null sem datas de aporte. */
  irr: number | null;
  /** VPL contra a taxa de atratividade informada. */
  npv: number;
  attractivenessRate: number;
  paybackMonths: number | null;
  totalDividends: number;
  /** Posições sem cotação — a UI precisa avisar. */
  stalePositions: string[];
}

/**
 * Meses cheios entre uma data e hoje, contados no CALENDÁRIO.
 *
 * Dividir a diferença em dias por uma média de 30,4375 erra o aniversário
 * exato: 365 dias davam 11 meses, não 12. Aqui a conta é (anos × 12 + meses),
 * descontando um mês quando o dia do mês ainda não chegou.
 */
export function monthsSince(date: string, today: Date): number | null {
  const [ys = '', ms = '', ds = ''] = date.split('-');
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  const start = Date.UTC(year, month - 1, day);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (start > now) return null;

  const months =
    (today.getUTCFullYear() - year) * 12 +
    (today.getUTCMonth() + 1 - month) -
    (today.getUTCDate() < day ? 1 : 0);
  return Math.max(0, months);
}

/** Converte retorno total em taxa anual equivalente. */
export function annualize(totalReturn: number, months: number): number | null {
  if (months <= 0) return null;
  const base = 1 + totalReturn;
  if (base <= 0) return null;
  return Math.round((base ** (12 / months) - 1) * 10000) / 10000;
}

export interface AnalyzeOptions {
  profile: RiskProfile;
  /** Taxa de atratividade (custo de oportunidade), decimal ao ano. */
  attractivenessRate: number;
  today?: Date;
}

export function analyzePortfolio(
  inputs: PositionInput[],
  options: AnalyzeOptions,
): PortfolioMetrics {
  const today = options.today ?? new Date();

  const positions: PositionMetrics[] = inputs.map((input) => {
    const priceStale = input.currentPrice === null;
    const price = input.currentPrice ?? input.avgPrice;
    const invested = round2(input.quantity * input.avgPrice);
    const currentValue = round2(input.quantity * price);
    const profit = round2(currentValue - invested);
    const monthsHeld = input.acquiredOn ? monthsSince(input.acquiredOn, today) : null;
    const profitPercent = invested > 0 ? Math.round((profit / invested) * 10000) / 100 : null;

    return {
      ticker: input.ticker,
      assetClass: input.assetClass,
      quantity: input.quantity,
      avgPrice: input.avgPrice,
      currentPrice: input.currentPrice,
      invested,
      currentValue,
      profit,
      profitPercent,
      weight: 0, // preenchido abaixo, quando o total é conhecido
      volatility: annualizedVolatility(input.closes),
      liquidity: liquidityLevel(currentValue, input.dailyVolumeValue),
      monthsHeld,
      annualizedReturn:
        monthsHeld !== null && monthsHeld > 0 && invested > 0
          ? annualize(profit / invested, monthsHeld)
          : null,
      dividendYieldOnCost:
        invested > 0 && input.dividendsReceived > 0
          ? Math.round((input.dividendsReceived / invested) * 10000) / 100
          : null,
      paybackByDividends: paybackFromDividends(
        invested,
        input.dividendsReceived,
        monthsHeld ?? 0,
      ),
      priceStale,
    };
  });

  const currentValue = round2(positions.reduce((sum, p) => sum + p.currentValue, 0));
  const invested = round2(positions.reduce((sum, p) => sum + p.invested, 0));
  for (const position of positions) {
    position.weight =
      currentValue > 0 ? Math.round((position.currentValue / currentValue) * 10000) / 100 : 0;
  }

  const allocation: Partial<Record<AssetClass, number>> = {};
  for (const position of positions) {
    allocation[position.assetClass] =
      round2((allocation[position.assetClass] ?? 0) + position.weight);
  }

  const gaps = allocationGaps(allocation, options.profile);
  const weights = positions.map((p) => p.currentValue);

  // Volatilidade da carteira ponderada pelo peso. É uma aproximação: ignora a
  // correlação entre ativos, então superestima o risco de uma carteira bem
  // diversificada. Dizer isso é melhor que fingir uma matriz de covariância
  // que não temos dados para estimar.
  const withVol = positions.filter((p) => p.volatility !== null);
  const volWeight = withVol.reduce((sum, p) => sum + p.currentValue, 0);
  const portfolioVolatility =
    volWeight > 0
      ? Math.round(
          (withVol.reduce((sum, p) => sum + (p.volatility as number) * p.currentValue, 0) /
            volWeight) *
            10000,
        ) / 10000
      : null;

  // Fluxo de caixa da carteira: aporte como saída no mês do aporte, proventos
  // distribuídos linearmente, e o valor de mercado de hoje como valor terminal.
  const flows: CashFlow[] = [];
  const horizon = Math.max(
    0,
    ...positions.map((p) => p.monthsHeld ?? 0),
  );
  let hasDates = false;
  for (const input of inputs) {
    const months = input.acquiredOn ? monthsSince(input.acquiredOn, today) : null;
    if (months === null) continue;
    hasDates = true;
    flows.push({ month: horizon - months, amount: -round2(input.quantity * input.avgPrice) });
    if (input.dividendsReceived > 0 && months > 0) {
      // Proventos entram no meio do período, aproximação razoável sem o extrato.
      flows.push({ month: horizon - Math.floor(months / 2), amount: round2(input.dividendsReceived) });
    }
  }
  if (hasDates) flows.push({ month: horizon, amount: currentValue });

  const totalDividends = round2(inputs.reduce((sum, i) => sum + i.dividendsReceived, 0));

  return {
    positions,
    invested,
    currentValue,
    profit: round2(currentValue - invested),
    profitPercent:
      invested > 0 ? Math.round(((currentValue - invested) / invested) * 10000) / 100 : null,
    allocation,
    gaps,
    alignmentScore: alignmentScore(gaps),
    hhi: herfindahl(weights),
    effectivePositions: effectivePositions(weights),
    concentration: concentrationLevel(herfindahl(weights)),
    portfolioVolatility,
    irr: hasDates ? irr(flows) : null,
    npv: hasDates ? npv(options.attractivenessRate, flows) : 0,
    attractivenessRate: options.attractivenessRate,
    paybackMonths: hasDates ? paybackMonths(flows) : null,
    totalDividends,
    stalePositions: positions.filter((p) => p.priceStale).map((p) => p.ticker),
  };
}
