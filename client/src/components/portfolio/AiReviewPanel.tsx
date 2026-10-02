import { AlertTriangle, Sparkles, Target } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { reviewPortfolio, type Criterion, type PortfolioReview } from '../../services/portfolio';

const CRITERION_LABELS: Record<Criterion, string> = {
  rentabilidade: 'Rentabilidade',
  risco: 'Risco',
  liquidez: 'Liquidez',
  prazo: 'Prazo',
  alinhamento: 'Alinhamento',
};

const IMPACT_TONE: Record<string, string> = {
  alto: 'var(--status-bad)',
  medio: 'var(--status-warn)',
  baixo: 'var(--status-good)',
};

const SUGGESTIONS = [
  'Quero viver de renda em 15 anos',
  'Quero comprar um imóvel em 5 anos',
  'Quero reduzir o risco sem perder rentabilidade',
  'Quero montar minha reserva de emergência',
];

/**
 * Avaliação da carteira pela IA. O usuário declara o que quer resolver, e o
 * backend entrega o panorama JÁ CALCULADO ao modelo — a IA interpreta e aponta
 * prioridades, nunca recalcula número.
 */
export function AiReviewPanel({ rate }: { rate?: number }) {
  const [objetivo, setObjetivo] = useState('');
  const [review, setReview] = useState<PortfolioReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (objetivo.trim().length < 5) {
      setError('Descreva em uma frase o que você quer resolver.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await reviewPortfolio(objetivo.trim(), rate);
      setReview(result.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao avaliar a carteira.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="size-4 text-gold" aria-hidden />
        Avaliação do copiloto
      </h4>
      <p className="mt-1 mb-3 text-xs text-ink-muted">
        Diga o que você quer resolver. A IA lê os números acima e aponta o que desenvolver melhor
        para esse objetivo.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <label className="block text-sm">
          <span className="sr-only">Seu objetivo</span>
          <textarea
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            maxLength={600}
            rows={2}
            placeholder="Ex.: quero viver de renda em 15 anos sem depender de cripto"
            className="w-full resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setObjetivo(suggestion)}
              className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted transition-colors hover:border-gold hover:text-gold"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-strong disabled:opacity-60"
        >
          {loading ? 'Analisando…' : 'Avaliar minha carteira'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      {review && (
        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <div>
            <h5 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Panorama
            </h5>
            <p className="mt-1 text-sm">{review.panorama}</p>
          </div>

          <div className="rounded-xl border border-gold/40 bg-gold/5 p-3">
            <h5 className="flex items-center gap-1.5 text-xs font-semibold text-gold uppercase tracking-wide">
              <Target className="size-3.5" aria-hidden />
              Sobre o seu objetivo
            </h5>
            <p className="mt-1 text-sm">{review.resposta_ao_objetivo}</p>
          </div>

          <div>
            <h5 className="mb-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Nota por critério
            </h5>
            <ul className="space-y-2" aria-label="Notas por critério">
              {review.criterios.map((item) => {
                const tone =
                  item.nota >= 7
                    ? 'var(--status-good)'
                    : item.nota >= 4
                      ? 'var(--status-warn)'
                      : 'var(--status-bad)';
                return (
                  <li key={item.criterio} className="rounded-xl border border-line p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">
                        {CRITERION_LABELS[item.criterio] ?? item.criterio}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: tone }}>
                        {item.nota.toFixed(1)}
                        <span className="text-xs font-normal text-ink-muted">/10</span>
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={item.nota}
                      aria-valuemin={0}
                      aria-valuemax={10}
                      aria-label={`${CRITERION_LABELS[item.criterio]}: ${item.nota} de 10`}
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/70"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.nota * 10}%`, backgroundColor: tone }}
                      />
                    </div>
                    <p className="mt-2 text-xs">{item.leitura}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-muted">{item.evidencia}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h5 className="mb-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
              O que desenvolver melhor
            </h5>
            <ol className="space-y-2" aria-label="Prioridades de melhoria">
              {review.prioridades.map((item, index) => (
                <li
                  key={item.titulo}
                  className="rounded-xl border border-line p-3"
                  style={{ borderLeft: `3px solid ${IMPACT_TONE[item.impacto] ?? 'var(--line)'}` }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {index + 1}. {item.titulo}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        color: IMPACT_TONE[item.impacto],
                        backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
                      }}
                    >
                      impacto {item.impacto}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs">
                    <strong className="text-ink-muted">Por quê: </strong>
                    {item.porque}
                  </p>
                  <p className="mt-1 text-xs">
                    <strong className="text-ink-muted">Como: </strong>
                    {item.como}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {review.riscos.length > 0 && (
            <div>
              <h5 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                <AlertTriangle className="size-3.5" aria-hidden />
                Riscos
              </h5>
              <ul className="space-y-1 text-xs text-ink-muted">
                {review.riscos.map((risco) => (
                  <li key={risco} className="flex gap-2">
                    <span aria-hidden>·</span>
                    <span>{risco}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-ink-muted">{review.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
