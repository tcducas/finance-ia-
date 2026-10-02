import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../lib/format';
import type { Quote } from '../../types/market';

interface QuoteListProps {
  quotes: Quote[];
  onRemove?: (ticker: string) => void;
  'aria-label': string;
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{
        color: positive ? 'var(--status-good)' : 'var(--status-bad)',
        backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
      }}
    >
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/** Ações e cripto convivem na mesma lista, então cada linha diz de onde vem. */
function MarketBadge({ market }: { market: Quote['market'] }) {
  const crypto = market === 'CRYPTO';
  return (
    <span
      className="rounded-full border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted"
      title={crypto ? 'Cripto — cotação em tempo real' : 'Ação/FII brasileiro — atraso de ~15 min'}
    >
      {crypto ? 'Cripto' : 'B3'}
    </span>
  );
}

export function QuoteList({ quotes, onRemove, 'aria-label': ariaLabel }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
        Nada por aqui ainda.
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-label={ariaLabel}>
      {quotes.map((q) => (
        <li
          key={`${q.market}:${q.ticker}`}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3"
        >
          <Link
            // Prefixo explícito: evita o backend ter de adivinhar o mercado.
            to={`/app/investimentos/${encodeURIComponent(`${q.market}:${q.ticker}`)}`}
            className="min-w-0 flex-1 outline-none focus-visible:text-gold"
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {q.ticker}
              <MarketBadge market={q.market} />
            </p>
            <p className="truncate text-xs text-ink-muted">{q.name}</p>
          </Link>
          <p className="text-sm font-medium tabular-nums">{formatMoney(q.price, q.currency)}</p>
          <ChangeBadge value={q.changePercent} />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(q.ticker)}
              aria-label={`Remover ${q.ticker} da watchlist`}
              className="grid size-7 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--status-bad)]"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
