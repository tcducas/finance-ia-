import { brapiAdapter, getMovers as getBrMovers } from './brapiAdapter.js';
import { cryptoAdapter } from './cryptoAdapter.js';
import { finnhubAdapter } from './finnhubAdapter.js';
import type { AssetDetail, AssetRef, MarketAdapter, MarketId, Quote } from './types.js';

/**
 * Ponto único de roteamento entre mercados. Antes disso, o regex/sanitize de
 * ticker estava duplicado em marketService, watchlistController e ai/anonymize;
 * o de mercado (BR) segue aqui, o de cripto em cryptoAdapter.
 */

const adapters: Record<MarketId, MarketAdapter> = {
  BR: brapiAdapter,
  CRYPTO: cryptoAdapter,
  US: finnhubAdapter,
};

/** Mercados prontos para consulta agora (US depende de FINNHUB_API_KEY). */
export function availableMarkets(): MarketId[] {
  return (Object.keys(adapters) as MarketId[]).filter((id) => adapters[id].available());
}

export function adapterFor(market: MarketId): MarketAdapter {
  return adapters[market];
}

/** Separa "CRYPTO:BTCUSDT" / "US:AAPL" em { market, ticker } quando há prefixo. */
export function parsePrefixed(input: string): { market: MarketId | null; ticker: string } {
  const [maybePrefix, ...rest] = input.split(':');
  const upper = maybePrefix?.trim().toUpperCase();
  if (rest.length > 0 && (upper === 'BR' || upper === 'CRYPTO' || upper === 'US')) {
    return { market: upper, ticker: rest.join(':').trim() };
  }
  return { market: null, ticker: input.trim() };
}

function matchByShape(ticker: string): MarketId | null {
  // Só resolve quando UM mercado reivindica o formato; empate vai para o lookup
  // nos catálogos, que é mais caro mas não erra o mercado.
  const claims = (['BR', 'CRYPTO', 'US'] as MarketId[]).filter((id) =>
    adapters[id].matches(ticker),
  );
  return claims.length === 1 ? (claims[0] ?? null) : null;
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

  const candidates = availableMarkets();
  const found = (
    await Promise.all(
      candidates.map(async (id) => ((await adapters[id].validate(upper).catch(() => null)) ? id : null)),
    )
  ).filter((id): id is MarketId => id !== null);

  // Empate = mais de um catálogo tem o ticker. BR vence (é um app brasileiro) e
  // o chamador recebe `ambiguous: true` para avisar o usuário.
  if (found.length > 1) {
    return { market: found.includes('BR') ? 'BR' : (found[0] ?? 'BR'), ticker: upper, ambiguous: true };
  }
  return { market: found[0] ?? 'BR', ticker: upper, ambiguous: false };
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
  sources: Partial<Record<MarketId, 'ok' | 'unavailable'>>;
}

export async function searchAssets(
  query: string,
  marketParam: MarketId | undefined,
  limit: number,
): Promise<SearchResult> {
  const targets: MarketId[] = marketParam ? [marketParam] : availableMarkets();
  const sources: Partial<Record<MarketId, 'ok' | 'unavailable'>> = {};
  for (const id of targets) sources[id] = 'ok';

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
