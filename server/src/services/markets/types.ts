/** Contrato comum a qualquer fonte de dados de mercado (BR, cripto, ...). */

export type MarketId = 'BR' | 'CRYPTO';

export interface Quote {
  ticker: string;
  market: MarketId;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  high52w: number | null;
  low52w: number | null;
  marketCap: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logoUrl: string | null;
  updatedAt: string | null;
  /** BR: sempre true (~15min, plano gratuito). CRYPTO: false (tempo real). */
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
}
