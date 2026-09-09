import { ArrowRight } from 'lucide-react';
import type { PortfolioAnalysis } from '../../services/ai';

/** Renderiza o bloco estruturado "atual → sugerido" devolvido pela IA. */
export function SuggestionBlock({ analysis }: { analysis: PortfolioAnalysis }) {
  return (
    <div className="space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm">
      <p className="font-medium">{analysis.resumo}</p>

      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Atual</p>
        <p className="mt-0.5">{analysis.atual}</p>
      </div>

      <div>
        <p className="flex items-center gap-1 text-xs font-semibold text-ink-muted uppercase tracking-wide">
          <ArrowRight className="size-3" aria-hidden />
          Sugerido
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {analysis.sugerido.map((item) => (
            <li key={item.classe}>
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-medium">{item.classe}</span>
                <span className="text-gold font-semibold tabular-nums">{item.pct}%</span>
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/70"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.min(item.pct, 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{item.justificativa}</p>
            </li>
          ))}
        </ul>
      </div>

      {analysis.riscos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Riscos</p>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs text-ink-muted">
            {analysis.riscos.map((risco) => (
              <li key={risco}>{risco}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-ink-muted">{analysis.passo_educativo}</p>
      <p className="border-t border-line pt-2 text-xs font-medium text-ink-muted">
        {analysis.disclaimer}
      </p>
    </div>
  );
}
