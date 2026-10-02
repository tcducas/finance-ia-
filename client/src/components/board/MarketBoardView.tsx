import { Clock, RefreshCw, Sparkles, TriangleAlert, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCopilot } from '../../context/CopilotContext';
import { formatMoney } from '../../lib/format';
import { fetchBoard, PAIRS_BY_MARKET } from '../../services/board';
import { intervalLabel, type MarketBoard } from '../../types/board';
import type { MarketId } from '../../types/market';
import { CandleChart } from './CandleChart';
import { OrderBook } from './OrderBook';
import { TradeTape } from './TradeTape';
import { Skeleton } from '../ui/Skeleton';

interface MarketBoardViewProps {
  market: MarketId;
  /** Tela do copiloto: 'cripto' | 'acoes-b3' | 'internacional'. */
  copilotScreen: string;
  /** Aviso específico do mercado (volatilidade, câmbio, tributação…). */
  disclaimer: React.ReactNode;
  /** Mensagem exibida quando o proxy caiu e os dados são de exemplo. */
  placeholderNote: React.ReactNode;
}

/**
 * Board de trade compartilhado por Cripto, Ações B3 e Internacional.
 *
 * Os painéis aparecem conforme `support` que o backend devolve: só cripto tem
 * livro de ofertas e tape (Binance pública); brapi e finnhub gratuitos entregam
 * candle e cotação. A UI lê a capacidade em vez de checar o mercado.
 *
 * SOMENTE LEITURA — o Aura direciona e explica, nunca executa ordem.
 */
export function MarketBoardView({
  market,
  copilotScreen,
  disclaimer,
  placeholderNote,
}: MarketBoardViewProps) {
  const { openWith } = useCopilot();
  const pairs = PAIRS_BY_MARKET[market];
  const [symbol, setSymbol] = useState(pairs[0]?.symbol ?? '');
  const [interval, setInterval] = useState<string | undefined>(undefined);
  const [board, setBoard] = useState<MarketBoard | null>(null);
  const [placeholder, setPlaceholder] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchBoard(market, symbol, interval);
    setBoard(result.data);
    setPlaceholder(result.source === 'placeholder');
    setLoading(false);
  }, [market, symbol, interval]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Trocar de ativo reseta o período: os mercados não compartilham intervalos.
  function selectSymbol(next: string) {
    setSymbol(next);
    setInterval(undefined);
  }

  const up = (board?.stats.changePercent ?? 0) >= 0;
  const quote = board?.quote ?? 'BRL';
  const color = up ? 'var(--status-good)' : 'var(--status-bad)';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          {board?.delayed === false ? (
            <>
              <Zap className="size-3.5" aria-hidden />
              Cotação em tempo real
            </>
          ) : (
            <>
              <Clock className="size-3.5" aria-hidden />
              Cotação com atraso (~15 min)
            </>
          )}
          <span>· board somente leitura</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() =>
              openWith({
                screen: copilotScreen,
                ticker: symbol,
                kickoff: `Explique detalhadamente o board de ${symbol}: como ler os candles de ${intervalLabel(
                  board?.interval ?? '',
                )}${
                  board?.support.book
                    ? ', o que o livro de ofertas e o spread revelam sobre liquidez, o que é pressão de compra e o que os negócios recentes indicam'
                    : ', o que a máxima/mínima e o volume do período dizem sobre o ativo'
                }. Explique também os riscos deste mercado para quem está começando.`,
              })
            }
            className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
          >
            <Sparkles className="size-4" aria-hidden />
            Explicar este board
          </button>
        </div>
      </div>

      {placeholder && (
        <p
          role="status"
          className="rounded-2xl border border-line bg-elevated px-4 py-2.5 text-xs text-ink-muted"
        >
          {placeholderNote}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ativo">
        {pairs.map((pair) => (
          <button
            key={pair.symbol}
            type="button"
            role="radio"
            aria-checked={symbol === pair.symbol}
            onClick={() => selectSymbol(pair.symbol)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              symbol === pair.symbol
                ? 'border-gold bg-gold text-white'
                : 'border-line bg-elevated text-ink-muted hover:border-gold hover:text-gold'
            }`}
          >
            {pair.label}
            <span className="ml-1 text-xs opacity-70">{pair.suffix}</span>
          </button>
        ))}
      </div>

      {loading && !board ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-80" />
        </div>
      ) : board ? (
        <>
          <div className="rounded-2xl border border-line bg-elevated p-4">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  {board.base}
                  {board.market === 'CRYPTO' && `/${board.quote}`}
                </p>
                <p className="truncate text-xs text-ink-muted">{board.name}</p>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <p className="text-3xl font-bold tabular-nums" style={{ color }}>
                    {formatMoney(board.stats.price, quote)}
                  </p>
                  <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                    {up ? '+' : ''}
                    {board.stats.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <Stat
                  label={board.market === 'CRYPTO' ? 'Máx 24h' : 'Máx do dia'}
                  value={board.stats.high !== null ? formatMoney(board.stats.high, quote) : '—'}
                />
                <Stat
                  label={board.market === 'CRYPTO' ? 'Mín 24h' : 'Mín do dia'}
                  value={board.stats.low !== null ? formatMoney(board.stats.low, quote) : '—'}
                />
                <Stat
                  label="Abertura"
                  value={board.stats.open !== null ? formatMoney(board.stats.open, quote) : '—'}
                />
                <Stat
                  label={`Volume (${board.base})`}
                  value={
                    board.stats.volume !== null
                      ? board.stats.volume.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                      : '—'
                  }
                />
              </dl>
            </div>
          </div>

          <div
            className={`grid gap-4 ${board.book || board.trades ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : ''}`}
          >
            <div className="rounded-2xl border border-line bg-elevated p-4">
              <div
                className="mb-3 flex justify-end gap-1"
                role="radiogroup"
                aria-label="Período do candle"
              >
                {board.support.intervals.map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={board.interval === i}
                    onClick={() => setInterval(i)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      board.interval === i ? 'bg-gold text-white' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {intervalLabel(i)}
                  </button>
                ))}
              </div>

              {board.candlesUnavailable ? (
                <p className="grid h-72 place-items-center px-6 text-center text-sm text-ink-muted">
                  A fonte deste mercado não devolveu histórico de candles — no finnhub, o endpoint
                  de candles exige plano pago. Cotação e estatísticas do dia seguem válidas.
                </p>
              ) : (
                <>
                  <CandleChart
                    candles={board.candles}
                    currency={quote}
                    interval={board.interval}
                  />
                  <p className="mt-2 text-[11px] text-ink-muted">
                    Cada candle resume um período de {intervalLabel(board.interval).toLowerCase()}:
                    o corpo vai da abertura ao fechamento, as sombras marcam máxima e mínima. Verde
                    fecha acima da abertura, vermelho abaixo.
                  </p>
                </>
              )}
            </div>

            {(board.book || board.trades) && (
              <div className="space-y-4">
                {board.book && (
                  <OrderBook
                    book={board.book}
                    base={board.base}
                    quote={board.quote}
                    price={board.stats.price}
                  />
                )}
                {board.trades && (
                  <TradeTape trades={board.trades} base={board.base} quote={board.quote} />
                )}
              </div>
            )}
          </div>

          {!board.support.book && (
            <p className="text-xs text-ink-muted">
              Livro de ofertas e negócios recentes não aparecem neste mercado: as fontes gratuitas
              de {board.market === 'BR' ? 'B3' : 'ações dos EUA'} não expõem o book. Em Cripto os
              dois painéis estão disponíveis.
            </p>
          )}

          <p
            role="note"
            className="flex items-start gap-2 rounded-2xl border border-line bg-elevated px-4 py-3 text-xs text-ink-muted"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              style={{ color: 'var(--status-warn)' }}
              aria-hidden
            />
            <span>{disclaimer}</span>
          </p>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
