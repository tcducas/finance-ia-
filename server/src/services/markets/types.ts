/** Contrato comum a qualquer fonte de dados de mercado (BR, cripto, ...). */

export type MarketId = 'BR' | 'CRYPTO' | 'US';

export interface Quote {
  ticker: string;
  market: MarketId;
  name: string;
  /** Moeda em que `price` está cotado (BRL para BR, quote asset para cripto). */
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  /** Máx/mín do dia (24h em cripto). null quando a fonte não informa. */
  dayHigh: number | null;
  dayLow: number | null;
  high52w: number | null;
  low52w: number | null;
  marketCap: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logoUrl: string | null;
  updatedAt: string | null;
  /** BR e US: true (~15min no plano gratuito). CRYPTO: false (tempo real). */
  delayed: boolean;
}

export interface AssetDetail extends Quote {
  history: Array<{ date: string; close: number }>;
}

export interface Movers {
  gainers: Quote[];
  losers: Quote[];
}

/** Entrada de catálogo — o suficiente para buscar e validar sem cotar. */
export interface AssetRef {
  ticker: string;
  market: MarketId;
  name: string;
  type: string;
  currency: string;
}

/** Candle OHLC para o board de trade. `time` é ISO (UTC). */
export interface OhlcCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface DepthLevel {
  price: number;
  qty: number;
  /** Quantidade acumulada do topo do livro até aqui. */
  cumulative: number;
  /** Fração de `cumulative` sobre o total do lado (0..1). */
  depthRatio: number;
}

export interface OrderBookSnapshot {
  bids: DepthLevel[];
  asks: DepthLevel[];
  spread: number;
  spreadPercent: number;
  /** Pressão de compra: bids / (bids + asks) no topo do livro, 0..1. */
  buyPressure: number;
}

export interface BoardTrade {
  id: number;
  price: number;
  qty: number;
  time: string;
  side: 'compra' | 'venda';
}

/**
 * O que o board de cada mercado consegue mostrar. Livro de ofertas e tape só
 * existem em cripto (Binance pública); brapi e finnhub gratuitos não expõem.
 * A UI lê isto em vez de esconder painel por `if (market === 'CRYPTO')`.
 */
export interface BoardSupport {
  /** Períodos de candle que a fonte entrega de graça. */
  intervals: string[];
  book: boolean;
  trades: boolean;
}

export interface MarketAdapter {
  id: MarketId;
  /** false quando a fonte está sabidamente fora do ar (ex.: Binance 451). */
  available(): boolean;
  /** Heurística de formato — usada só quando não há prefixo/param explícito. */
  matches(ticker: string): boolean;
  /** Catálogo completo, cacheado pelo adapter (ver catalogCache). */
  catalog(): Promise<Map<string, AssetRef>>;
  search(query: string, limit: number): Promise<AssetRef[]>;
  validate(ticker: string): Promise<AssetRef | null>;
  quotes(tickers: string[]): Promise<Quote[]>;
  detail(ticker: string, range: string): Promise<AssetDetail>;

  // --- Board de trade (opcional por mercado) --------------------------------
  board?: BoardSupport;
  ohlc?(ticker: string, interval: string): Promise<OhlcCandle[]>;
  orderBook?(ticker: string): Promise<OrderBookSnapshot>;
  tape?(ticker: string): Promise<BoardTrade[]>;
  /** Passo mínimo de preço/quantidade, quando a fonte informa. */
  steps?(ticker: string): Promise<{ tickSize: number; stepSize: number }>;
}
