import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  /** Torna o card clicável (ex.: abrir o copiloto). */
  onClick?: () => void;
}

export function StatCard({ icon: Icon, label, value, hint, loading, onClick }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-28 rounded-lg" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      )}
      {hint && !loading && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl border border-line bg-elevated p-4 text-left shadow-sm transition-colors hover:border-gold"
      >
        {inner}
      </button>
    );
  }

  return <div className="rounded-2xl border border-line bg-elevated p-4 shadow-sm">{inner}</div>;
}
