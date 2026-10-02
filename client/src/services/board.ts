import type { BoardTrade, DepthLevel, MarketBoard, OhlcCandle } from '../types/board';
import type { MarketId, MarketResult } from '../types/market';

/**
 * Board de trade — sempre via proxy /api/market/board (o frontend nunca fala com
 * Binance, brapi ou finnhub direto). Se o proxy estiver fora (bloqueio regional
 * 451 da Binance, chave do finnhub ausente, sem rede), cai para DADOS DE EXEMPLO
 * marcados — nunca números reais inventados.
 */

export interface PairOption {
  symbol: string;
  label: string;
  /** Sufixo mostrado no botão: moeda de cotação ou bolsa. */
  suffix: string;
}

/** Pares de cripto em destaque: BRL para o usuário brasileiro, USDT global. */
export const CRYPTO_PAIRS: PairOption[] = [
  { symbol: 'BTCBRL', label: 'Bitcoin', suffix: 'BRL' },
  { symbol: 'ETHBRL', label: 'Ethereum', suffix: 'BRL' },
  { symbol: 'SOLBRL', label: 'Solana', suffix: 'BRL' },
  { symbol: 'XRPBRL', label: 'XRP', suffix: 'BRL' },
  { symbol: 'BTCUSDT', label: 'Bitcoin', suffix: 'USDT' },
  { symbol: 'ETHUSDT', label: 'Ethereum', suffix: 'USDT' },
];

/** Ações e FIIs líquidos da B3. */
export const B3_PAIRS: PairOption[] = [
  { symbol: 'PETR4', label: 'Petrobras', suffix: 'PN' },
  { symbol: 'VALE3', label: 'Vale', suffix: 'ON' },
  { symbol: 'ITUB4', label: 'Itaú', suffix: 'PN' },
  { symbol: 'BBAS3', label: 'Banco do Brasil', suffix: 'ON' },
  { symbol: 'WEGE3', label: 'WEG', suffix: 'ON' },
  { symbol: 'BBDC4', label: 'Bradesco', suffix: 'PN' },
];

/** Ações e ETFs dos EUA — o recorte que uma Nomad/Avenue oferece. */
export const US_PAIRS: PairOption[] = [
  { symbol: 'AAPL', label: 'Apple', suffix: 'NASDAQ' },
  { symbol: 'MSFT', label: 'Microsoft', suffix: 'NASDAQ' },
  { symbol: 'NVDA', label: 'NVIDIA', suffix: 'NASDAQ' },
  { symbol: 'AMZN', label: 'Amazon', suffix: 'NASDAQ' },
  { symbol: 'VOO', label: 'S&P 500 (ETF)', suffix: 'NYSE' },
  { symbol: 'QQQ', label: 'Nasdaq 100 (ETF)', suffix: 'NASDAQ' },
];

export const PAIRS_BY_MARKET: Record<MarketId, PairOption[]> = {
  CRYPTO: CRYPTO_PAIRS,
  BR: B3_PAIRS,
  US: US_PAIRS,
};

async function api<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const body = (await res.json().catch(() => null)) as { data: T } | { error: unknown } | null;
  if (!res.ok || body === null || 'error' in body) throw new Error('board api indisponível');
  return body.data;
}

export async function fetchBoard(
  market: MarketId,
  symbol: string,
  interval?: string,
): Promise<MarketResult<MarketBoard>> {
  const params = new URLSearchParams({ market });
  if (interval) params.set('interval', interval);
  try {
    const data = await api<MarketBoard>(
      `/api/market/board/${encodeURIComponent(symbol)}?${params.toString()}`,
    );
    return { source: 'api', data };
  } catch {
    return { source: 'placeholder', data: sampleBoard(market, symbol, interval) };
  }
}

// --- Dados de exemplo (PLACEHOLDER — fictícios, para demonstração) -----------

/** PRNG determinística: o mesmo par gera sempre o mesmo exemplo. */
function seeded(seed: number): () => number {
  let state = Math.abs(seed) % 2147483647 || 1;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

const SAMPLE_PRICE: Record<string, number> = {
  BTCBRL: 612_400,
  ETHBRL: 21_350,
  SOLBRL: 1180,
  XRPBRL: 14.6,
  BTCUSDT: 112_800,
  ETHUSDT: 3940,
  PETR4: 38.42,
  VALE3: 61.75,
  ITUB4: 33.9,
  BBAS3: 27.15,
  WEGE3: 41.3,
  BBDC4: 14.82,
  AAPL: 238.4,
  MSFT: 429.1,
  NVDA: 182.6,
  AMZN: 231.7,
  VOO: 604.2,
  QQQ: 528.9,
};

const SUPPORT: Record<MarketId, { intervals: string[]; book: boolean; trades: boolean }> = {
  CRYPTO: { intervals: ['15m', '1h', '4h', '1d'], book: true, trades: true },
  BR: { intervals: ['1d', '1wk', '1mo'], book: false, trades: false },
  US: { intervals: ['60', 'D', 'W'], book: false, trades: false },
};

const INTERVAL_MS: Record<string, number> = {
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '60': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 86_400_000,
  D: 86_400_000,
  '1wk': 7 * 86_400_000,
  W: 7 * 86_400_000,
  '1mo': 30 * 86_400_000,
};

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

function sampleCandles(base: number, interval: string, rand: () => number): OhlcCandle[] {
  const step = INTERVAL_MS[interval] ?? 86_400_000;
  const now = Date.now();
  const out: OhlcCandle[] = [];
  let price = base * 0.94;
  for (let i = 119; i >= 0; i -= 1) {
    const open = price;
    const close = Math.max(base * 0.5, open + (rand() - 0.47) * base * 0.012);
    const wick = base * 0.004 * rand();
    out.push({
      time: new Date(now - i * step).toISOString(),
      open: round(open),
      high: round(Math.max(open, close) + wick),
      low: round(Math.min(open, close) - wick),
      close: round(close),
      volume: round(10 + rand() * 90),
    });
    price = close;
  }
  return out;
}

const QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'BRL', 'BTC', 'ETH'];

function sampleBoard(market: MarketId, rawSymbol: string, interval?: string): MarketBoard {
  const symbol = rawSymbol.toUpperCase();
  const support = SUPPORT[market];
  const safeInterval =
    interval && support.intervals.includes(interval) ? interval : (support.intervals[0] as string);
  const base = SAMPLE_PRICE[symbol] ?? 100;
  const rand = seeded(symbol.length * 7919 + Math.round(base));
  const candles = sampleCandles(base, safeInterval, rand);
  const last = candles.at(-1);
  const price = last?.close ?? base;
  const previous = candles.at(-2)?.close ?? base;

  let baseAsset = symbol;
  let quoteAsset = market === 'US' ? 'USD' : 'BRL';
  if (market === 'CRYPTO') {
    const suffix = QUOTE_SUFFIXES.find((q) => symbol.endsWith(q));
    if (suffix) {
      baseAsset = symbol.slice(0, -suffix.length);
      quoteAsset = suffix;
    }
  }

  const mkLevels = (dir: -1 | 1): DepthLevel[] => {
    const rows: Array<{ price: number; qty: number }> = [];
    for (let i = 1; i <= 20; i += 1) {
      rows.push({ price: round(price * (1 + dir * i * 0.0004)), qty: round(0.2 + rand() * 2.4) });
    }
    const total = rows.reduce((sum, l) => sum + l.qty, 0);
    let cumulative = 0;
    return rows.map((l) => {
      cumulative += l.qty;
      return { ...l, cumulative: round(cumulative), depthRatio: cumulative / total };
    });
  };

  let book: MarketBoard['book'] = null;
  if (support.book) {
    const bids = mkLevels(-1);
    const asks = mkLevels(1);
    const bestBid = bids[0]?.price ?? price;
    const bestAsk = asks[0]?.price ?? price;
    const spread = bestAsk - bestBid;
    const bidTotal = bids.at(-1)?.cumulative ?? 1;
    const askTotal = asks.at(-1)?.cumulative ?? 1;
    book = {
      bids,
      asks,
      spread: round(spread),
      spreadPercent: round((spread / bestAsk) * 100),
      buyPressure: round(bidTotal / (bidTotal + askTotal)),
    };
  }

  let trades: BoardTrade[] | null = null;
  if (support.trades) {
    trades = Array.from({ length: 25 }, (_, i) => ({
      id: 1000 + i,
      price: round(price * (1 + (rand() - 0.5) * 0.0015)),
      qty: round(0.01 + rand() * 0.6),
      time: new Date(Date.now() - i * 7000).toISOString(),
      side: rand() > 0.5 ? ('compra' as const) : ('venda' as const),
    }));
  }

  return {
    market,
    symbol,
    name: `${baseAsset} (exemplo)`,
    base: baseAsset,
    quote: quoteAsset,
    interval: safeInterval,
    support,
    stats: {
      price,
      change: round(price - previous),
      changePercent: round(((price - previous) / previous) * 100),
      high: round(Math.max(...candles.slice(-24).map((c) => c.high))),
      low: round(Math.min(...candles.slice(-24).map((c) => c.low))),
      open: last?.open ?? null,
      volume: round(candles.slice(-24).reduce((s, c) => s + (c.volume ?? 0), 0)),
    },
    candles,
    book,
    trades,
    delayed: market !== 'CRYPTO',
    tickSize: 0.01,
    stepSize: market === 'CRYPTO' ? 0.00001 : 1,
    candlesUnavailable: false,
  };
}
