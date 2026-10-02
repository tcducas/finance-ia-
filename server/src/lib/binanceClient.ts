import { env } from '../env.js';
import { AppError } from '../errors/AppError.js';
import { logger } from './logger.js';

/**
 * Cliente Binance somente-leitura — endpoints públicos, SEM API key. Não
 * existe (e não pode existir aqui) nenhum caminho de ordem: o Aura direciona,
 * nunca executa. Herdado do padrão de validação de símbolo do projeto
 * `API -TRADE` (bot de grid trading), descartando tudo relativo a ordens.
 */

export interface SymbolMeta {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  stepSize: number;
  tickSize: number;
  minNotional: number;
}

export interface Ticker24h {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  /** Volume em moeda de cotação (BRL/USDT) — comparável entre pares. */
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  trades: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Nível do livro de ofertas: [preço, quantidade]. */
export interface DepthLevel {
  price: number;
  qty: number;
}

export interface OrderBook {
  lastUpdateId: number;
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  time: number;
  /** true = comprador era o maker, ou seja, a agressão foi de VENDA. */
  isBuyerMaker: boolean;
}

/** Arredonda para o step/tick permitido pela exchange (porta de gridBot.js). */
export function roundStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value;
  const precision = Math.max(0, Math.round(-Math.log10(step)));
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(precision));
}

async function binanceGet(path: string, timeoutMs = 10_000): Promise<unknown> {
  const url = `${env.BINANCE_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new AppError('Mercado cripto indisponível no momento.', 'CRYPTO_UNAVAILABLE', 502);
  }
  if (res.status === 451) {
    // Bloqueio regional é o modo de falha mais comum da Binance pública —
    // degrada como "cripto indisponível", nunca derruba a rota inteira.
    logger.warn({ path }, '[crypto] binance bloqueada nesta região (451)');
    throw new AppError('Mercado cripto indisponível nesta região.', 'CRYPTO_UNAVAILABLE', 502);
  }
  if (!res.ok) {
    throw new AppError('Mercado cripto indisponível no momento.', 'CRYPTO_UNAVAILABLE', 502);
  }
  return res.json();
}

interface RawSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  filters: Array<Record<string, unknown>>;
}

function filterValue(filters: Array<Record<string, unknown>>, type: string, key: string): number {
  const filter = filters.find((f) => f.filterType === type);
  const raw = filter?.[key];
  return typeof raw === 'string' ? Number(raw) : 0;
}

/**
 * Catálogo de símbolos SPOT em negociação. A resposta bruta passa de 2MB —
 * projetamos só os campos usados no parse, nunca guardamos o JSON inteiro.
 */
export async function exchangeInfo(): Promise<Map<string, SymbolMeta>> {
  const body = (await binanceGet('/api/v3/exchangeInfo?permissions=SPOT')) as {
    symbols?: RawSymbol[];
  };
  const map = new Map<string, SymbolMeta>();
  for (const s of body.symbols ?? []) {
    if (s.status !== 'TRADING') continue;
    map.set(s.symbol, {
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      status: s.status,
      stepSize: filterValue(s.filters, 'LOT_SIZE', 'stepSize'),
      tickSize: filterValue(s.filters, 'PRICE_FILTER', 'tickSize'),
      minNotional:
        filterValue(s.filters, 'NOTIONAL', 'minNotional') ||
        filterValue(s.filters, 'MIN_NOTIONAL', 'minNotional'),
    });
  }
  return map;
}

interface RawTicker24h {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume?: string;
  highPrice: string;
  lowPrice: string;
  openPrice?: string;
  count?: number;
}

export async function tickers24h(symbols: string[]): Promise<Ticker24h[]> {
  if (symbols.length === 0) return [];
  const query = encodeURIComponent(JSON.stringify(symbols));
  const body = (await binanceGet(`/api/v3/ticker/24hr?symbols=${query}`)) as RawTicker24h[];
  return (Array.isArray(body) ? body : [body]).map((t) => ({
    symbol: t.symbol,
    lastPrice: Number(t.lastPrice),
    priceChange: Number(t.priceChange),
    priceChangePercent: Number(t.priceChangePercent),
    volume: Number(t.volume),
    quoteVolume: Number(t.quoteVolume ?? 0),
    highPrice: Number(t.highPrice),
    lowPrice: Number(t.lowPrice),
    openPrice: Number(t.openPrice ?? 0),
    trades: Number(t.count ?? 0),
  }));
}

export async function klines(symbol: string, interval: string, limit: number): Promise<Kline[]> {
  const body = (await binanceGet(
    `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`,
  )) as Array<[number, string, string, string, string, string]>;
  return body.map((k) => ({
    openTime: k[0],
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}

/**
 * Livro de ofertas (profundidade). SOMENTE LEITURA: o Aura mostra onde está a
 * liquidez para o usuário entender o mercado — nunca envia ordem.
 */
export async function depth(symbol: string, limit: number): Promise<OrderBook> {
  const body = (await binanceGet(
    `/api/v3/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
  )) as {
    lastUpdateId?: number;
    bids?: Array<[string, string]>;
    asks?: Array<[string, string]>;
  };
  const toLevels = (rows: Array<[string, string]>): DepthLevel[] =>
    rows.map(([price, qty]) => ({ price: Number(price), qty: Number(qty) }));
  return {
    lastUpdateId: body.lastUpdateId ?? 0,
    bids: toLevels(body.bids ?? []),
    asks: toLevels(body.asks ?? []),
  };
}

/** Negócios recentes do par — o "tape" do board. */
export async function recentTrades(symbol: string, limit: number): Promise<Trade[]> {
  const body = (await binanceGet(
    `/api/v3/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
  )) as Array<{ id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }>;
  return body.map((t) => ({
    id: t.id,
    price: Number(t.price),
    qty: Number(t.qty),
    time: t.time,
    isBuyerMaker: t.isBuyerMaker,
  }));
}
