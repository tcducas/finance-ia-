import type { MarketId } from '../services/markets/types.js';

/**
 * Planos e o que cada um libera. Função PURA, sem I/O: é a fonte única da
 * verdade do gating, consultada pelo backend e espelhada na UI pelo /api/me.
 *
 * `plan` é comercial; `is_admin` é permissão administrativa. Admin NÃO recebe
 * Pro implicitamente — quem concede plano é o painel Admin, explicitamente.
 * Misturar os dois faria o acesso comercial depender de um cargo técnico.
 *
 * O plano free precisa continuar útil: ele mantém B3 e cripto, metas e
 * projeções sem limite, e o copiloto com cota. O Pro remove as cotas e abre o
 * mercado internacional, que é o único com custo real por requisição.
 */

export const PLANS = ['free', 'pro'] as const;
export type Plan = (typeof PLANS)[number];

export function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value);
}

export interface Entitlements {
  /** Mercados consultáveis. O internacional (finnhub) é pago por requisição. */
  markets: MarketId[];
  /** Períodos de candle liberados por mercado; o resto é filtrado do board. */
  boardIntervals: Record<MarketId, string[]>;
  /** Livro de ofertas e negócios recentes (só cripto os tem de fato). */
  book: boolean;
  /** Janela máxima do gráfico de evolução do patrimônio, em meses. */
  evolutionMonths: number;
  /** Mensagens de chat por dia. null = ilimitado. */
  aiChatPerDay: number | null;
  /** Análises de carteira por mês. null = ilimitado. */
  aiAnalyzePerMonth: number | null;
}

const FREE: Entitlements = {
  markets: ['BR', 'CRYPTO'],
  boardIntervals: { BR: ['1d'], CRYPTO: ['1d'], US: [] },
  book: false,
  evolutionMonths: 6,
  aiChatPerDay: 10,
  aiAnalyzePerMonth: 2,
};

const PRO: Entitlements = {
  markets: ['BR', 'CRYPTO', 'US'],
  boardIntervals: {
    BR: ['1d', '1wk', '1mo'],
    CRYPTO: ['15m', '1h', '4h', '1d'],
    US: ['60', 'D', 'W'],
  },
  book: true,
  evolutionMonths: 24,
  aiChatPerDay: null,
  aiAnalyzePerMonth: null,
};

const BY_PLAN: Record<Plan, Entitlements> = { free: FREE, pro: PRO };

export function entitlementsFor(plan: Plan): Entitlements {
  return BY_PLAN[plan];
}

/** Plano desconhecido no banco cai em free — nunca em pro. */
export function planFrom(value: unknown): Plan {
  return isPlan(value) ? value : 'free';
}

export function allowsMarket(plan: Plan, market: MarketId): boolean {
  return entitlementsFor(plan).markets.includes(market);
}

/**
 * Interseção entre os períodos que a fonte entrega e os que o plano libera.
 * Nunca devolve vazio: se o plano não cobre nenhum, fica o primeiro da fonte,
 * para a UI ter um botão em vez de um board sem gráfico.
 */
export function allowedIntervals(
  plan: Plan,
  market: MarketId,
  sourceIntervals: string[],
): string[] {
  const allowed = entitlementsFor(plan).boardIntervals[market] ?? [];
  const intersection = sourceIntervals.filter((i) => allowed.includes(i));
  if (intersection.length > 0) return intersection;
  const first = sourceIntervals[0];
  return first ? [first] : [];
}

/** Janela de evolução pedida, limitada ao teto do plano. */
export function clampEvolutionMonths(plan: Plan, requested: number): number {
  return Math.min(requested, entitlementsFor(plan).evolutionMonths);
}

export type AiKind = 'chat' | 'analyze';

/** Período de agregação da cota: chat é diário, análise é mensal. */
export function usagePeriod(kind: AiKind, now: Date = new Date()): string {
  const iso = now.toISOString();
  return kind === 'chat' ? iso.slice(0, 10) : iso.slice(0, 7);
}

export function aiLimitFor(plan: Plan, kind: AiKind): number | null {
  const e = entitlementsFor(plan);
  return kind === 'chat' ? e.aiChatPerDay : e.aiAnalyzePerMonth;
}

/** true quando o consumo atual já bateu o limite do plano. */
export function aiQuotaExceeded(plan: Plan, kind: AiKind, used: number): boolean {
  const limit = aiLimitFor(plan, kind);
  return limit !== null && used >= limit;
}
