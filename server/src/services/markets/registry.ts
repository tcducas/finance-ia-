import { brapiAdapter, getMovers as getBrMovers } from './brapiAdapter.js';
import { cryptoAdapter } from './cryptoAdapter.js';
import type { AssetDetail, AssetRef, MarketAdapter, MarketId, Quote } from './types.js';

/**
 * Ponto único de roteamento entre mercados. Antes disso, o regex/sanitize de
 * ticker estava duplicado em marketService, watchlistController e ai/anonymize;
 * o de mercado (BR) segue aqui, o de cripto em cryptoAdapter.
 */

const adapters: Record<MarketId, MarketAdapter> = { BR: brapiAdapter, CRYPTO: cryptoAdapter };

/** Separa "CRYPTO:BTCUSDT" em { market, ticker } quando o prefixo existe. */
export function parsePrefixed(input: string): { market: MarketId | null; ticker: string } {
  const [maybePrefix, ...rest] = input.split(':');
  const upper = maybePrefix?.trim().toUpperCase();
  if (rest.length > 0 && (upper === 'BR' || upper === 'CRYPTO')) {
    return { market: upper, ticker: rest.join(':').trim() };
  }
  return { market: null, ticker: input.trim() };
}

function matchByShape(ticker: string): MarketId | null {
  const br = brapiAdapter.matches(ticker);
  const crypto = cryptoAdapter.matches(ticker);
  if (br && !crypto) return 'BR';
  if (crypto && !br) return 'CRYPTO';
  return null;
}

/**
 * Resolve o mercado de um ticker: prefixo explícito > `?market=` > heurística
 * de formato > lookup nos dois catálogos (empate = BR vence, é um app
 * brasileiro; o chamador recebe `ambiguous: true` para avisar o usuário).
 */
export async function resolveMarket(
  rawTicker: string,
  marketParam?: MarketId,
): Promise<{ market: MarketId; ticker: string; ambiguous: boolean }> {
  const { market: prefixed, ticker } = parsePrefixed(rawTicker);
  const upper = ticker.toUpperCase();
  if (prefixed) return { market: prefixed, ticker: upper, ambiguous: false };
  if (marketParam) return { market: marketParam, ticker: upper, ambiguous: false };

  const byShape = matchByShape(upper);
  if (byShape) return { market: byShape, ticker: upper, ambiguous: false };

  const [brRef, cryptoRef] = await Promise.all([
    brapiAdapter.validate(upper).catch(() => null),
    cryptoAdapter.validate(upper).catch(() => null),
  ]);
  if (brRef && cryptoRef) return { market: 'BR', ticker: upper, ambiguous: true };
  if (cryptoRef) return { market: 'CRYPTO', ticker: upper, ambiguous: false };
  return { market: 'BR', ticker: upper, ambiguous: false };
}

export async function getQuotesMulti(rawTickers: string[]): Promise<{ quotes: Quote[]; partial: boolean }> {
  const grouped = new Map<MarketId, string[]>();
  for (const raw of rawTickers) {
    const { market, ticker } = parsePrefixed(raw);
    const resolved = market ?? matchByShape(ticker.toUpperCase()) ?? 'BR';
    const list = grouped.get(resolved) ?? [];
    list.push(ticker);
    grouped.set(resolved, list);
  }

  let partial = false;
  const results: Quote[] = [];
  await Promise.all(
    [...grouped.entries()].map(async ([market, tickers]) => {
      try {
        results.push(...(await adapters[market].quotes(tickers)));
      } catch {
        partial = true;
      }
    }),
  );
  return { quotes: results, partial };
}

export async function getAssetDetail(
  rawTicker: string,
  range: string,
  marketParam?: MarketId,
): Promise<AssetDetail> {
  const { market, ticker } = await resolveMarket(rawTicker, marketParam);
  return adapters[market].detail(ticker, range);
}

export interface ValidateResult {
  asset: AssetRef;
  quote: Quote;
  ambiguous: boolean;
}

export async function validateTicker(
  rawTicker: string,
  marketParam?: MarketId,
): Promise<ValidateResult | null> {
  const { market, ticker, ambiguous } = await resolveMarket(rawTicker, marketParam);
  const asset = await adapters[market].validate(ticker);
  if (!asset) return null;
  const [quote] = await adapters[market].quotes([ticker]).catch(() => [] as Quote[]);
  if (!quote) return null;
  return { asset, quote, ambiguous };
}

export interface SearchResultItem extends AssetRef {
  price: number | null;
  changePercent: number | null;
}

export interface SearchResult {
  results: SearchResultItem[];
  sources: Record<MarketId, 'ok' | 'unavailable'>;
}

export async function searchAssets(
  query: string,
  marketParam: MarketId | undefined,
  limit: number,
): Promise<SearchResult> {
  const targets: MarketId[] = marketParam ? [marketParam] : ['BR', 'CRYPTO'];
  const sources: Record<MarketId, 'ok' | 'unavailable'> = { BR: 'ok', CRYPTO: 'ok' };

  const refsByMarket = await Promise.all(
    targets.map(async (market) => {
      try {
        return await adapters[market].search(query, limit);
      } catch {
        sources[market] = 'unavailable';
        return [] as AssetRef[];
      }
    }),
  );
  const refs = refsByMarket.flat().slice(0, limit);

  // Enriquece com cotação em lote (uma chamada por mercado presente nos
  // resultados) — falha na cotação não derruba a busca, só some price/changePercent.
  const quotesByKey = new Map<string, Quote>();
  await Promise.all(
    targets.map(async (market) => {
      const tickers = refs.filter((r) => r.market === market).map((r) => r.ticker);
      if (tickers.length === 0) return;
      try {
        for (const q of await adapters[market].quotes(tickers)) {
          quotesByKey.set(`${market}:${q.ticker}`, q);
        }
      } catch {
        // busca segue sem enriquecimento de preço
      }
    }),
  );

  const results = refs.map((ref) => {
    const q = quotesByKey.get(`${ref.market}:${ref.ticker}`);
    return { ...ref, price: q?.price ?? null, changePercent: q?.changePercent ?? null };
  });

  return { results, sources };
}

export const getMovers = getBrMovers;
