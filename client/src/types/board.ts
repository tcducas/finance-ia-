// Espelha o contrato de /api/market/board/:ticker
// (server/src/services/boardService.ts).

import type { MarketId } from './market';

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
  cumulative: number;
  /** 0..1 — largura da barra de profundidade. */
  depthRatio: number;
}

export interface OrderBookSnapshot {
  bids: DepthLevel[];
  asks: DepthLevel[];
  spread: number;
  spreadPercent: number;
  /** 0..1 — fração do volume do livro em ofertas de compra. */
  buyPressure: number;
}

export interface BoardTrade {
  id: number;
  price: number;
  qty: number;
  time: string;
  side: 'compra' | 'venda';
}

/** O que a fonte de cada mercado consegue entregar. */
export interface BoardSupport {
  intervals: string[];
  book: boolean;
  trades: boolean;
}

export interface BoardStats {
  price: number;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  open: number | null;
  volume: number | null;
}

export interface MarketBoard {
  market: MarketId;
  symbol: string;
  name: string;
  base: string;
  quote: string;
  interval: string;
  support: BoardSupport;
  stats: BoardStats;
  candles: OhlcCandle[];
  book: OrderBookSnapshot | null;
  trades: BoardTrade[] | null;
  delayed: boolean;
  tickSize: number | null;
  stepSize: number | null;
  /** true quando a fonte não devolveu candle (ex.: endpoint pago no finnhub). */
  candlesUnavailable: boolean;
}

/** Rótulo humano de cada período de candle, por mercado. */
export const INTERVAL_LABELS: Record<string, string> = {
  '15m': '15 min',
  '1h': '1 hora',
  '4h': '4 horas',
  '1d': 'Diário',
  '1wk': 'Semanal',
  '1mo': 'Mensal',
  '60': '1 hora',
  D: 'Diário',
  W: 'Semanal',
};

export function intervalLabel(interval: string): string {
  return INTERVAL_LABELS[interval] ?? interval;
}
