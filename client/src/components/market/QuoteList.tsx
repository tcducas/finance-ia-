import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
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
          key={q.ticker}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3"
        >
          <Link
            to={`/app/investimentos/${encodeURIComponent(q.ticker)}`}
            className="min-w-0 flex-1 outline-none focus-visible:text-gold"
          >
            <p className="text-sm font-semibold">{q.ticker}</p>
            <p className="truncate text-xs text-ink-muted">{q.name}</p>
          </Link>
          <p className="text-sm font-medium tabular-nums">{formatCurrency(q.price)}</p>
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
