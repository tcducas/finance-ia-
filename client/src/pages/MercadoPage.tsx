import { ArrowRight, Bitcoin, Building2, Clock, Globe, Plus, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { QuoteList } from '../components/market/QuoteList';
import { formatMoney } from '../lib/format';
import {
  addWatchlist,
  fetchMovers,
  fetchQuotes,
  listWatchlist,
  removeWatchlist,
} from '../services/market';
import type { MarketId, Movers, Quote, WatchlistItem } from '../types/market';
import { Skeleton } from '../components/ui/Skeleton';

const INDICES = ['BR:^BVSP'];

/** Pares em BRL: o app é brasileiro, então o preço já sai em real. */
const CRYPTO_HIGHLIGHTS = ['CRYPTO:BTCBRL', 'CRYPTO:ETHBRL', 'CRYPTO:SOLBRL', 'CRYPTO:XRPBRL'];

const MARKETS: Array<{ id: MarketId; label: string; placeholder: string }> = [
  { id: 'BR', label: 'B3', placeholder: 'Ex.: PETR4' },
  { id: 'CRYPTO', label: 'Cripto', placeholder: 'Ex.: BTCBRL' },
  { id: 'US', label: 'EUA', placeholder: 'Ex.: AAPL' },
];

/** Atalhos para os boards dedicados — esta tela é o panorama, não o board. */
const BOARDS = [
  { to: '/app/acoes', label: 'Ações B3', icon: Building2, hint: 'candles e volume da B3' },
  { to: '/app/cripto', label: 'Cripto', icon: Bitcoin, hint: 'livro de ofertas e negócios ao vivo' },
  { to: '/app/internacional', label: 'Internacional', icon: Globe, hint: 'ações e ETFs em dólar' },
];

/**
 * Tela: Investimentos (panorama) — rota `/app/investimentos`
 * Menu: grupo "Mercados" → "Investimentos"
 * Visão GERAL dos mercados: índices, destaques de cripto, watchlist (mista) e
 * maiores altas/quedas da B3, com atalhos para os boards dedicados.
 * Ver também AcoesB3Page, CriptoPage, InternacionalPage e AtivoDetalhePage.
 */
export function MercadoPage() {
  const [indices, setIndices] = useState<Quote[]>([]);
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [watchItems, setWatchItems] = useState<WatchlistItem[]>([]);
  const [watchQuotes, setWatchQuotes] = useState<Quote[]>([]);
  const [movers, setMovers] = useState<Movers | null>(null);
  const [placeholder, setPlaceholder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<MarketId>('BR');
  const [ticker, setTicker] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const items = await listWatchlist();
    const [idx, cry, watch, mov] = await Promise.all([
      fetchQuotes(INDICES),
      fetchQuotes(CRYPTO_HIGHLIGHTS),
      // Prefixado: a watchlist mistura mercados e o backend não deve adivinhar.
      fetchQuotes(items.map((i) => `${i.market}:${i.ticker}`)),
      fetchMovers(),
    ]);
    setWatchItems(items);
    setIndices(idx.data);
    setCrypto(cry.data);
    setWatchQuotes(watch.data);
    setMovers(mov.data);
    setPlaceholder([idx, cry, watch, mov].some((r) => r.source === 'placeholder'));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    try {
      await addWatchlist(ticker, market);
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

  const activeMarket = MARKETS.find((m) => m.id === market) ?? MARKETS[0];

  return (
    <section aria-labelledby="investimentos-titulo" className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="investimentos-titulo" className="font-display text-2xl font-bold tracking-tight">
            Investimentos
          </h2>
          <p className="mb-1 text-sm text-ink-muted">
            Panorama dos mercados. Para o board completo de cada um, use as abas abaixo.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              B3: atraso de ~15 min
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5" aria-hidden />
              Cripto: tempo real
            </span>
            <span>· atualização manual no MVP</span>
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
          <strong>Dados de exemplo</strong> — a API de mercado não está acessível neste ambiente.
          Os valores exibidos são fictícios, para demonstração.
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
              <ChangePercent value={q.changePercent} />
            </div>
          </div>
        ))}
      </div>

      <nav aria-label="Boards por mercado" className="grid gap-3 sm:grid-cols-3">
        {BOARDS.map(({ to, label, icon: Icon, hint }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated p-4 transition-colors hover:border-gold"
          >
            <Icon className="size-5 text-gold" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs text-ink-muted">{hint}</span>
            </span>
            <ArrowRight
              className="size-4 text-ink-muted transition-colors group-hover:text-gold"
              aria-hidden
            />
          </Link>
        ))}
      </nav>

      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-muted uppercase tracking-wide">
          <Bitcoin className="size-4" aria-hidden />
          Cripto em destaque
        </h3>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {crypto.map((q) => (
              <div key={q.ticker} className="rounded-2xl border border-line bg-elevated p-4">
                <p className="truncate text-xs font-medium text-ink-muted uppercase tracking-wide">
                  {q.name}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {formatMoney(q.price, q.currency)}
                </p>
                <ChangePercent value={q.changePercent} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Minha watchlist
            </h3>
          </div>

          <div
            className="mb-2 flex rounded-full border border-line p-1 text-xs"
            role="radiogroup"
            aria-label="Mercado do ativo"
          >
            {MARKETS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={market === m.id}
                onClick={() => setMarket(m.id)}
                className={`flex-1 rounded-full px-3 py-1 font-medium transition-colors ${
                  market === m.id ? 'bg-gold text-on-gold' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void handleAdd(e)} className="mb-3 flex gap-2">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder={`Adicionar ticker (${activeMarket?.placeholder})`}
              aria-label="Ticker para adicionar à watchlist"
              className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm uppercase outline-none transition-colors focus:border-gold"
            />
            <button
              type="submit"
              aria-label="Adicionar à watchlist"
              className="flex items-center gap-1 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-strong"
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
            <Skeleton className="h-24" />
          ) : (
            <QuoteList
              quotes={watchQuotes}
              onRemove={(t) => void handleRemove(t)}
              aria-label="Watchlist"
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              <TrendingUp className="size-4" aria-hidden />
              Maiores altas do dia (B3)
            </h3>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <QuoteList quotes={movers?.gainers ?? []} aria-label="Maiores altas" />
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Maiores quedas do dia (B3)
            </h3>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <QuoteList quotes={movers?.losers ?? []} aria-label="Maiores quedas" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChangePercent({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className="text-sm font-semibold tabular-nums"
      style={{ color: positive ? 'var(--status-good)' : 'var(--status-bad)' }}
    >
      {positive ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}
