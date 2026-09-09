import { Target } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

/** Planejamento — metas, projeções e score (Fase 2 do roadmap). */
export function PlanejamentoPage() {
  return (
    <section aria-labelledby="planejamento-titulo" className="mx-auto max-w-5xl">
      <h2 id="planejamento-titulo" className="mb-1 text-2xl font-bold tracking-tight">
        Planejamento
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Metas, projeções e score financeiro.</p>
      <EmptyState
        icon={Target}
        title="Em breve"
        description="Metas, projeções e score fazem parte da Fase 2 do roadmap."
      />
    </section>
  );
}
