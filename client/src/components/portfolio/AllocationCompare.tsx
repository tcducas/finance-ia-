import { ASSET_CLASS_COLORS, ASSET_CLASS_LABELS, type AllocationGap } from '../../services/portfolio';

interface AllocationCompareProps {
  gaps: AllocationGap[];
  profile: string;
  alignmentScore: number;
}

/**
 * Alocação atual × alvo do perfil, classe por classe.
 *
 * Duas barras sobrepostas em vez de dois gráficos lado a lado: o que importa é a
 * DISTÂNCIA entre elas, e distância se lê melhor quando as barras compartilham a
 * mesma régua. A barra fina marca o alvo; a grossa, a posição real.
 */
export function AllocationCompare({ gaps, profile, alignmentScore }: AllocationCompareProps) {
  const max = Math.max(10, ...gaps.map((g) => Math.max(g.actual, g.target)));
  const tone =
    alignmentScore >= 75
      ? 'var(--status-good)'
      : alignmentScore >= 45
        ? 'var(--status-warn)'
        : 'var(--status-bad)';

  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Alinhamento ao perfil</h4>
          <p className="text-xs text-ink-muted">
            Sua carteira comparada a um retrato típico do perfil{' '}
            <strong className="text-ink">{profile}</strong>.
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums" style={{ color: tone }}>
          {alignmentScore}
          <span className="text-sm font-normal text-ink-muted"> / 100</span>
        </p>
      </div>

      <ul className="space-y-3" aria-label="Alocação atual comparada ao alvo">
        {gaps.map((gap) => {
          const color = ASSET_CLASS_COLORS[gap.assetClass];
          const above = gap.gap > 0.5;
          const below = gap.gap < -0.5;
          return (
            <li key={gap.assetClass}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium">{ASSET_CLASS_LABELS[gap.assetClass]}</span>
                <span className="tabular-nums text-ink-muted">
                  {gap.actual.toFixed(1)}% <span className="opacity-60">de {gap.target}%</span>
                  {(above || below) && (
                    <span
                      className="ml-1.5 font-semibold"
                      style={{ color: above ? 'var(--status-warn)' : 'var(--status-bad)' }}
                    >
                      {above ? '+' : ''}
                      {gap.gap.toFixed(1)}
                    </span>
                  )}
                </span>
              </div>

              <div className="relative mt-1 h-3">
                {/* trilha */}
                <div className="absolute inset-0 rounded-full bg-line/70" />
                {/* posição real */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                  style={{ width: `${(gap.actual / max) * 100}%`, backgroundColor: color }}
                />
                {/* marca do alvo */}
                <div
                  className="absolute inset-y-[-2px] w-0.5 rounded-full bg-ink"
                  style={{ left: `${(gap.target / max) * 100}%` }}
                  aria-hidden
                  title={`alvo ${gap.target}%`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center gap-3 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-5 rounded-full bg-[color:var(--chart-1)]" aria-hidden />
          onde você está
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-ink" aria-hidden />
          alvo do perfil
        </span>
      </p>

      <p className="mt-2 text-[11px] text-ink-muted">
        O alvo é referência <strong>educativa</strong> para medir distância, não recomendação. Um
        desvio pode ser intencional — o que importa é você saber que ele existe.
      </p>
    </div>
  );
}
