import { Clock, Plus, RefreshCw, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { QuoteList } from '../components/market/QuoteList';
import {
  addWatchlist,
  fetchMovers,
  fetchQuotes,
  listWatchlist,
  removeWatchlist,
} from '../services/market';
import type { Movers, Quote, WatchlistItem } from '../types/market';

const INDICES = ['^BVSP'];

/**
 * Tela: Investimentos (monitor) — rota `/app/investimentos`
 * Menu: "Investimentos" (4º item)
 * Índices, watchlist e maiores altas/quedas do dia. Ver também AtivoDetalhePage.
 */
export function MercadoPage() {
  const [indices, setIndices] = useState<Quote[]>([]);
  const [watchItems, setWatchItems] = useState<WatchlistItem[]>([]);
  const [watchQuotes, setWatchQuotes] = useState<Quote[]>([]);
  const [movers, setMovers] = useState<Movers | null>(null);
  const [placeholder, setPlaceholder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const items = await listWatchlist();
    const [idx, watch, mov] = await Promise.all([
      fetchQuotes(INDICES),
      fetchQuotes(items.map((i) => i.ticker)),
      fetchMovers(),
    ]);
    setWatchItems(items);
    setIndices(idx.data);
    setWatchQuotes(watch.data);
    setMovers(mov.data);
    setPlaceholder([idx, watch, mov].some((r) => r.source === 'placeholder'));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    try {
      await addWatchlist(ticker);
      setTicker('');
      setFormError(null);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao adicionar.');
    }
  }

  async function handleRemove(tk: string) {
    const item = watchItems.find((i) => i.ticker === tk);
    if (!item) return;
    await removeWatchlist(item.id);
    await refresh();
  }

  return (
    <section aria-labelledby="investimentos-titulo" className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="investimentos-titulo" className="text-2xl font-bold tracking-tight">
            Investimentos
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Clock className="size-3.5" aria-hidden />
            Cotações com atraso (~15 min) · atualização manual no MVP
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Atualizar
        </button>
      </div>

      {placeholder && (
        <p
          role="status"
          className="rounded-2xl border border-line bg-elevated px-4 py-2.5 text-xs text-ink-muted"
        >
          <strong>Dados de exemplo</strong> — a API de mercado (brapi.dev) não está acessível
          neste ambiente. Os valores exibidos são fictícios, para demonstração.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {indices.map((q) => (
          <div key={q.ticker} className="rounded-2xl border border-line bg-elevated p-4">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{q.name}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-xl font-bold tabular-nums">
                {q.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{
                  color: q.changePercent >= 0 ? 'var(--status-good)' : 'var(--status-bad)',
                }}
              >
                {q.changePercent >= 0 ? '+' : ''}
                {q.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Minha watchlist
            </h3>
          </div>
          <form onSubmit={(e) => void handleAdd(e)} className="mb-3 flex gap-2">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="Adicionar ticker (ex.: PETR4)"
              aria-label="Ticker para adicionar à watchlist"
              className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm uppercase outline-none transition-colors focus:border-gold"
            />
            <button
              type="submit"
              aria-label="Adicionar à watchlist"
              className="flex items-center gap-1 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </form>
          {formError && (
            <p role="alert" className="mb-2 text-xs" style={{ color: 'var(--status-bad)' }}>
              {formError}
            </p>
          )}
          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-line/60" />
          ) : (
            <QuoteList quotes={watchQuotes} onRemove={(t) => void handleRemove(t)} aria-label="Watchlist" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              <TrendingUp className="size-4" aria-hidden />
              Maiores altas do dia
            </h3>
            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-line/60" />
            ) : (
              <QuoteList quotes={movers?.gainers ?? []} aria-label="Maiores altas" />
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Maiores quedas do dia
            </h3>
            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-line/60" />
            ) : (
              <QuoteList quotes={movers?.losers ?? []} aria-label="Maiores quedas" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
