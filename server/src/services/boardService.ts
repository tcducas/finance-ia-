import { AppError } from '../errors/AppError.js';
import { adapterFor, resolveMarket } from './markets/registry.js';
import type {
  BoardSupport,
  BoardTrade,
  MarketId,
  OhlcCandle,
  OrderBookSnapshot,
} from './markets/types.js';

/**
 * Board de trade genérico — o mesmo contrato para B3, cripto e internacional.
 *
 * SOMENTE LEITURA, por princípio do produto: o board existe para o usuário (e o
 * copiloto) ENTENDEREM o mercado. Não existe caminho de ordem aqui e não deve
 * passar a existir.
 *
 * Cada mercado entrega o que sua fonte permite e declara isso em `support`:
 * cripto (Binance pública) tem livro de ofertas e tape; B3 (brapi) e EUA
 * (finnhub) no plano gratuito só têm candle e cotação. A UI lê `support` em vez
 * de esconder painel com `if (market === ...)`.
 */

export interface BoardStats {
  price: number;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  open: number | null;
  /** Volume no ativo-base (ações: quantidade; cripto: unidades). */
  volume: number | null;
}

export interface MarketBoard {
  market: MarketId;
  symbol: string;
  name: string;
  /** Ativo-base: "BTC" em BTCBRL, o próprio ticker em ações. */
  base: string;
  /** Moeda da cotação: BRL, USDT, USD… */
  quote: string;
  interval: string;
  support: BoardSupport;
  stats: BoardStats;
  candles: OhlcCandle[];
  /** null quando o mercado não expõe livro de ofertas. */
  book: OrderBookSnapshot | null;
  /** null quando o mercado não expõe negócios recentes. */
  trades: BoardTrade[] | null;
  delayed: boolean;
  tickSize: number | null;
  stepSize: number | null;
  /**
   * true quando a fonte não devolveu candle (ex.: /stock/candle do finnhub é
   * pago). O resto do board continua válido — a UI avisa em vez de mentir.
   */
  candlesUnavailable: boolean;
}

/** Ativo-base a partir do nome "BTC/BRL" dos pares de cripto. */
function splitBase(name: string, symbol: string, currency: string): { base: string; quote: string } {
  if (name.includes('/')) {
    const [base = symbol, quote = currency] = name.split('/');
    return { base, quote };
  }
  return { base: symbol, quote: currency };
}

export async function getBoard(
  rawSymbol: string,
  interval: string | undefined,
  marketParam?: MarketId,
): Promise<MarketBoard> {
  const { market, ticker } = await resolveMarket(rawSymbol, marketParam);
  const adapter = adapterFor(market);

  if (!adapter.available()) {
    throw new AppError(
      'Este mercado não está configurado no servidor.',
      'MARKET_NOT_CONFIGURED',
      503,
    );
  }

  const support = adapter.board;
  if (!support || !adapter.ohlc) {
    throw new AppError('Este mercado não tem board de trade.', 'BOARD_UNSUPPORTED', 400);
  }

  // Intervalo inválido cai no primeiro suportado em vez de devolver vazio.
  const safeInterval =
    interval && support.intervals.includes(interval) ? interval : (support.intervals[0] ?? '1d');

  const [quotes, candles, book, trades, steps] = await Promise.all([
    adapter.quotes([ticker]),
    adapter.ohlc(ticker, safeInterval),
    support.book && adapter.orderBook ? adapter.orderBook(ticker) : Promise.resolve(null),
    support.trades && adapter.tape ? adapter.tape(ticker) : Promise.resolve(null),
    adapter.steps ? adapter.steps(ticker) : Promise.resolve(null),
  ]);

  const quote = quotes[0];
  if (!quote) throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);

  const { base, quote: quoteCurrency } = splitBase(quote.name, quote.ticker, quote.currency);

  // Máx/mín do dia vêm do provedor quando existem; o último candle é fallback
  // (em intraday ele cobre só o próprio período, daí a preferência pelo provedor).
  const lastCandle = candles.at(-1);

  return {
    market,
    symbol: quote.ticker,
    name: quote.name,
    base,
    quote: quoteCurrency,
    interval: safeInterval,
    support,
    stats: {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      high: quote.dayHigh ?? lastCandle?.high ?? null,
      low: quote.dayLow ?? lastCandle?.low ?? null,
      open: lastCandle?.open ?? null,
      volume: quote.volume ?? lastCandle?.volume ?? null,
    },
    candles,
    book,
    trades,
    delayed: quote.delayed,
    tickSize: steps?.tickSize ?? null,
    stepSize: steps?.stepSize ?? null,
    candlesUnavailable: candles.length === 0,
  };
}
