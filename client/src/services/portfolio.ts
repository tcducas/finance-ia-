import type { AssetClassId, HoldingInput } from '../lib/importCsv';
import { getSessionToken, isDemoMode } from './data';

/**
 * Carteira de investimentos e seu panorama analítico.
 *
 * Todo o cálculo (VPL, TIR, payback, HHI, volatilidade, alinhamento) vive no
 * backend em `server/src/lib/portfolioAnalysis.ts`, função pura e testada. O
 * client não recalcula nada — só desenha. Por isso a análise exige login.
 */

export type RiskProfile = 'conservador' | 'moderado' | 'arrojado';
export type LiquidityLevel = 'alta' | 'media' | 'baixa' | 'desconhecida';
export type ConcentrationLevel = 'diversificada' | 'moderada' | 'concentrada';

export interface Holding {
  id: string;
  ticker: string;
  market: 'BR' | 'CRYPTO' | 'US';
  asset_class: AssetClassId;
  assetClass: AssetClassId;
  quantity: number;
  avg_price: number;
  acquired_on: string | null;
  dividends_received: number;
  created_at: string;
}

export interface PositionMetrics {
  ticker: string;
  assetClass: AssetClassId;
  quantity: number;
  avgPrice: number;
  currentPrice: number | null;
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: number | null;
  weight: number;
  volatility: number | null;
  liquidity: LiquidityLevel;
  monthsHeld: number | null;
  annualizedReturn: number | null;
  dividendYieldOnCost: number | null;
  paybackByDividends: number | null;
  priceStale: boolean;
}

export interface AllocationGap {
  assetClass: AssetClassId;
  actual: number;
  target: number;
  gap: number;
}

export interface Panorama {
  profile: RiskProfile;
  holdings: Holding[];
  positions: PositionMetrics[];
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: number | null;
  allocation: Partial<Record<AssetClassId, number>>;
  gaps: AllocationGap[];
  alignmentScore: number;
  hhi: number;
  effectivePositions: number;
  concentration: ConcentrationLevel;
  portfolioVolatility: number | null;
  irr: number | null;
  npv: number;
  attractivenessRate: number;
  paybackMonths: number | null;
  totalDividends: number;
  stalePositions: string[];
}

export type Criterion = 'rentabilidade' | 'risco' | 'liquidez' | 'prazo' | 'alinhamento';

export interface PortfolioReview {
  panorama: string;
  criterios: Array<{
    criterio: Criterion;
    nota: number;
    leitura: string;
    evidencia: string;
  }>;
  prioridades: Array<{
    titulo: string;
    porque: string;
    como: string;
    impacto: 'alto' | 'medio' | 'baixo';
  }>;
  riscos: string[];
  resposta_ao_objetivo: string;
  disclaimer: string;
}

export const ASSET_CLASS_LABELS: Record<AssetClassId, string> = {
  acao: 'Ações',
  fii: 'Fundos imobiliários',
  etf: 'ETFs',
  cripto: 'Cripto',
  renda_fixa: 'Renda fixa',
  internacional: 'Internacional',
  caixa: 'Caixa',
  outro: 'Outros',
};

/** Slot fixo na paleta por classe, para a cor não dançar entre gráficos. */
export const ASSET_CLASS_COLORS: Record<AssetClassId, string> = {
  acao: 'var(--chart-1)',
  fii: 'var(--chart-2)',
  etf: 'var(--chart-3)',
  cripto: 'var(--chart-4)',
  renda_fixa: 'var(--chart-5)',
  internacional: 'var(--chart-6)',
  caixa: 'var(--chart-7)',
  outro: 'var(--chart-other)',
};

export function portfolioAvailable(): boolean {
  return !isDemoMode();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getSessionToken() ?? ''}`,
    },
  });
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string; code: string } }
    | null;
  if (!res.ok || body === null || 'error' in body) {
    const error = body && 'error' in body ? body.error : undefined;
    throw Object.assign(new Error(error?.message ?? 'Erro ao falar com o servidor.'), {
      code: error?.code ?? 'NETWORK_ERROR',
      status: res.status,
    });
  }
  return body.data;
}

export function listHoldings(): Promise<Holding[]> {
  return api<Holding[]>('/api/portfolio');
}

export function fetchPanorama(rate?: number): Promise<Panorama> {
  const qs = rate === undefined ? '' : `?rate=${rate}`;
  return api<Panorama>(`/api/portfolio/panorama${qs}`);
}

export function createHolding(input: HoldingInput): Promise<Holding> {
  return api<Holding>('/api/portfolio', { method: 'POST', body: JSON.stringify(input) });
}

export function deleteHolding(id: string): Promise<void> {
  return api<{ id: string }>(`/api/portfolio/${id}`, { method: 'DELETE' }).then(() => undefined);
}

export function importHoldings(rows: HoldingInput[]): Promise<{ inserted: number }> {
  return api<{ inserted: number }>('/api/portfolio/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

export function reviewPortfolio(
  objetivo: string,
  rate?: number,
): Promise<{ review: PortfolioReview; panorama: Panorama }> {
  return api('/api/ai/portfolio', {
    method: 'POST',
    body: JSON.stringify({ objetivo, ...(rate !== undefined && { rate }) }),
  });
}
