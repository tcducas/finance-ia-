import { ChevronDown, Info } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  /** Leitura curta do número — o que ele significa aqui. */
  reading?: ReactNode;
  /** Cor semântica do valor; só use quando bom/ruim for inequívoco. */
  tone?: 'good' | 'warn' | 'bad';
  /** Explicação do método: o "por quê", escondido até o usuário pedir. */
  why: ReactNode;
}

const TONE: Record<string, string> = {
  good: 'var(--status-good)',
  warn: 'var(--status-warn)',
  bad: 'var(--status-bad)',
};

/**
 * Card de métrica com o "por quê" embutido. Cada número da análise de
 * investimentos carrega o método que o gerou — sem isso o usuário vê um número
 * e não aprende nada, que é o oposto do propósito educativo do app.
 */
export function MetricCard({ label, value, reading, tone, why }: MetricCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`Por que ${label}?`}
          className="grid size-6 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:text-gold"
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </div>

      <p
        className="mt-1 text-2xl font-bold tabular-nums"
        style={tone ? { color: TONE[tone] } : undefined}
      >
        {value}
      </p>
      {reading && <p className="mt-0.5 text-xs text-ink-muted">{reading}</p>}

      <div id={panelId} hidden={!open} className="mt-3 border-t border-line pt-3">
        <p className="text-xs leading-relaxed text-ink-muted">{why}</p>
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-gold transition-opacity hover:opacity-80"
        >
          por quê?
          <ChevronDown className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}
