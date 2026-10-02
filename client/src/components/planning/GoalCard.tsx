import { CheckCircle2, CircleAlert, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/format';
import type { GoalProjection } from '../../types/planning';

const KIND_LABEL: Record<string, string> = {
  reserva: 'Reserva de emergência',
  compra: 'Compra planejada',
  aposentadoria: 'Aposentadoria',
  geral: 'Geral',
};

/** "34" → "2 anos e 10 meses". */
export function formatMonths(months: number): string {
  if (months === 0) return 'agora';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`);
  return parts.join(' e ');
}

/** "2029-04" → "abr 2029". */
function formatMonthLabel(yearMonth: string): string {
  const [y = '', m = ''] = yearMonth.split('-');
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .replace('.', '');
}

interface GoalCardProps {
  projection: GoalProjection;
  selected: boolean;
  onSelect(): void;
  onEdit(): void;
  onRemove(): void;
}

export function GoalCard({ projection, selected, onSelect, onEdit, onRemove }: GoalCardProps) {
  const { goal, progress, monthsToTarget, estimatedDate, requiredMonthly, monthsToDeadline, onTrack } =
    projection;
  const percent = Math.round(progress * 100);
  const stateColor = onTrack ? 'var(--status-good)' : 'var(--status-warn)';
  const StateIcon = onTrack ? CheckCircle2 : CircleAlert;

  return (
    <li
      className={`group rounded-2xl border bg-elevated px-4 py-3 transition-colors ${
        selected ? 'border-gold' : 'border-line'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="min-w-0 flex-1 text-left outline-none focus-visible:text-gold"
        >
          <p className="truncate text-sm font-semibold">{goal.name}</p>
          <p className="text-xs text-ink-muted">
            {KIND_LABEL[goal.kind] ?? goal.kind} · prioridade {goal.priority}
          </p>
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar meta ${goal.name}`}
          className="grid size-7 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-gold"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover meta ${goal.name}`}
          className="grid size-7 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--status-bad)]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-muted tabular-nums">
        {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
      </p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name}: ${percent}% da meta`}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70"
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.min(progress, 1) * 100}%`, backgroundColor: stateColor }}
        />
      </div>

      <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: stateColor }}>
        <StateIcon className="size-3.5" aria-hidden />
        {percent}% ·{' '}
        {monthsToTarget === null
          ? 'sem aporte nem rendimento, a meta não avança'
          : `chega em ${formatMonths(monthsToTarget)}${estimatedDate ? ` (${formatMonthLabel(estimatedDate)})` : ''}`}
      </p>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Aporte atual</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(goal.monthly_contribution)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Rendimento</dt>
          <dd className="font-medium tabular-nums">
            {(goal.annual_rate * 100).toFixed(1)}% a.a.
          </dd>
        </div>
        {monthsToDeadline !== null && (
          <>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Prazo</dt>
              <dd className="font-medium tabular-nums">{formatMonths(monthsToDeadline)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Aporte necessário</dt>
              <dd
                className="font-medium tabular-nums"
                style={{
                  color:
                    requiredMonthly !== null && requiredMonthly > goal.monthly_contribution
                      ? 'var(--status-warn)'
                      : undefined,
                }}
              >
                {requiredMonthly === null ? '—' : formatCurrency(requiredMonthly)}
              </dd>
            </div>
          </>
        )}
      </dl>
    </li>
  );
}
