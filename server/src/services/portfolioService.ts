import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import {
  analyzePortfolio,
  isAssetClass,
  round2,
  type AssetClass,
  type PortfolioMetrics,
  type PositionInput,
} from '../lib/portfolioAnalysis.js';
import type { RiskProfile } from '../lib/riskScore.js';
import type { UserClient } from '../lib/supabase.js';
import type { HoldingCreateInput, HoldingUpdateInput } from '../schemas/holding.js';
import { adapterFor, getQuotesMulti } from './markets/registry.js';
import type { MarketId, Quote } from './markets/types.js';

/**
 * Carteira de investimentos: posições do usuário + panorama analítico.
 *
 * Os números vêm do motor puro (lib/portfolioAnalysis.ts); aqui só buscamos as
 * linhas e as cotações. A IA recebe este panorama pronto e apenas o interpreta.
 */

export type Holding = Tables<'holdings'>;

/** Taxa de atratividade default: Selic/CDI aproximado, usada no VPL. */
export const DEFAULT_ATTRACTIVENESS_RATE = 0.105;

/** Volatilidade é cara (1 chamada de histórico por ativo): limitamos o lote. */
const MAX_VOLATILITY_LOOKUPS = 15;

export async function listHoldings(db: UserClient): Promise<Holding[]> {
  const { data, error } = await db
    .from('holdings')
    .select('*')
    .order('asset_class')
    .order('ticker');
  if (error) throw fromPostgrest(error);
  return data;
}

export async function createHolding(
  db: UserClient,
  userId: string,
  input: HoldingCreateInput,
): Promise<Holding> {
  const { data, error } = await db
    .from('holdings')
    .insert({ ...input, ticker: input.ticker.toUpperCase(), user_id: userId })
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function updateHolding(
  db: UserClient,
  id: string,
  input: HoldingUpdateInput,
): Promise<Holding> {
  const patch = { ...input, ...(input.ticker && { ticker: input.ticker.toUpperCase() }) };
  const { data, error } = await db
    .from('holdings')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Posição não encontrada.', 'NOT_FOUND', 404);
  return data;
}

export async function deleteHolding(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db
    .from('holdings')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Posição não encontrada.', 'NOT_FOUND', 404);
}

export interface ImportResult {
  inserted: number;
}

/**
 * Importa a carteira. Upsert por (user_id, ticker, market): reimportar o mesmo
 * arquivo atualiza a posição em vez de duplicar — o caso normal é o usuário
 * exportar da corretora de novo no mês seguinte.
 */
export async function importHoldings(
  db: UserClient,
  userId: string,
  rows: HoldingCreateInput[],
): Promise<ImportResult> {
  const payload = rows.map((row) => ({
    ...row,
    ticker: row.ticker.toUpperCase(),
    user_id: userId,
  }));

  const { error } = await db
    .from('holdings')
    .upsert(payload, { onConflict: 'user_id,ticker,market' });
  if (error) throw fromPostgrest(error);
  return { inserted: payload.length };
}

export interface Panorama extends PortfolioMetrics {
  profile: RiskProfile;
  /** Classe de cada posição com rótulo legível, para a UI não traduzir sozinha. */
  holdings: Array<Holding & { assetClass: AssetClass }>;
}

function assetClassOf(holding: Holding): AssetClass {
  return isAssetClass(holding.asset_class) ? holding.asset_class : 'outro';
}

/** Volume financeiro do dia: volume em unidades × preço. */
function dailyVolumeValue(quote: Quote | undefined): number | null {
  if (!quote || quote.volume === null) return null;
  return round2(quote.volume * quote.price);
}

export async function getPanorama(
  db: UserClient,
  profile: RiskProfile,
  attractivenessRate = DEFAULT_ATTRACTIVENESS_RATE,
): Promise<Panorama> {
  const holdings = await listHoldings(db);

  if (holdings.length === 0) {
    return {
      ...analyzePortfolio([], { profile, attractivenessRate }),
      profile,
      holdings: [],
    };
  }

  // Cotações em lote, agrupadas por mercado pelo próprio registry.
  const prefixed = holdings.map((h) => `${h.market}:${h.ticker}`);
  const quoteByKey = new Map<string, Quote>();
  try {
    const { quotes } = await getQuotesMulti(prefixed);
    for (const quote of quotes) quoteByKey.set(`${quote.market}:${quote.ticker}`, quote);
  } catch {
    // Mercado fora do ar não derruba o panorama: as posições caem para o preço
    // médio e `stalePositions` avisa a UI.
  }

  // Histórico para a volatilidade, best-effort e limitado — uma posição sem
  // histórico fica com volatilidade null em vez de bloquear a análise.
  const closesByKey = new Map<string, number[]>();
  const lookups = holdings.slice(0, MAX_VOLATILITY_LOOKUPS);
  await Promise.all(
    lookups.map(async (holding) => {
      const adapter = adapterFor(holding.market as MarketId);
      if (!adapter.ohlc || !adapter.available()) return;
      const interval = adapter.board?.intervals.includes('1d') ? '1d' : adapter.board?.intervals[0];
      if (!interval) return;
      try {
        const candles = await adapter.ohlc(holding.ticker, interval);
        closesByKey.set(`${holding.market}:${holding.ticker}`, candles.map((c) => c.close));
      } catch {
        // sem histórico: segue sem volatilidade para esta posição
      }
    }),
  );

  const inputs: PositionInput[] = holdings.map((holding) => {
    const key = `${holding.market}:${holding.ticker}`;
    const quote = quoteByKey.get(key);
    return {
      ticker: holding.ticker,
      assetClass: assetClassOf(holding),
      quantity: holding.quantity,
      avgPrice: holding.avg_price,
      currentPrice: quote?.price ?? null,
      dailyVolumeValue: dailyVolumeValue(quote),
      closes: closesByKey.get(key) ?? [],
      acquiredOn: holding.acquired_on,
      dividendsReceived: holding.dividends_received,
    };
  });

  return {
    ...analyzePortfolio(inputs, { profile, attractivenessRate }),
    profile,
    holdings: holdings.map((h) => ({ ...h, assetClass: assetClassOf(h) })),
  };
}
