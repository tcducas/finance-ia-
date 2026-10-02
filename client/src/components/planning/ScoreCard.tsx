import { formatCurrency } from '../../lib/format';
import type { FinanceScore, ScoreBand } from '../../types/planning';

const BAND_META: Record<ScoreBand, { label: string; color: string }> = {
  atencao: { label: 'Precisa de atenção', color: 'var(--status-bad)' },
  razoavel: { label: 'Razoável', color: 'var(--status-warn)' },
  saudavel: { label: 'Saudável', color: 'var(--status-good)' },
};

interface ScoreCardProps {
  score: FinanceScore;
  netWorth: number;
  reserve: number;
}

/** Score de saúde financeira + os 4 pilares que o compõem (regra pura no backend). */
export function ScoreCard({ score, netWorth, reserve }: ScoreCardProps) {
  const meta = BAND_META[score.band];

  return (
    <div className="rounded-2xl border border-line bg-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Score de saúde financeira
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-4xl font-bold tabular-nums" style={{ color: meta.color }}>
              {score.score}
            </p>
            <span className="text-sm text-ink-muted">/ 100</span>
          </div>
          <p className="mt-0.5 text-sm font-medium" style={{ color: meta.color }}>
            {meta.label}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-muted">Patrimônio líquido</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(netWorth)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Reserva</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(reserve)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Cobertura</dt>
            <dd className="font-semibold tabular-nums">
              {score.emergencyMonths.toFixed(1)} {score.emergencyMonths === 1 ? 'mês' : 'meses'}
            </dd>
          </div>
        </dl>
      </div>

      {score.partial && (
        <p role="status" className="mt-4 rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
          Ainda sem receita lançada neste mês — o score fica incompleto até você registrar as
          entradas.
        </p>
      )}

      <ul className="mt-4 space-y-3" aria-label="Pilares do score">
        {score.pillars.map((pillar) => {
          const ratio = pillar.max > 0 ? pillar.points / pillar.max : 0;
          return (
            <li key={pillar.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{pillar.label}</span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {pillar.points} / {pillar.max}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pillar.points}
                aria-valuemin={0}
                aria-valuemax={pillar.max}
                aria-label={`${pillar.label}: ${pillar.points} de ${pillar.max} pontos`}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/70"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${ratio * 100}%`, backgroundColor: meta.color }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{pillar.detail}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
