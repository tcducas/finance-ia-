import { Crown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PlanGateProps {
  title: string;
  description: ReactNode;
}

/**
 * Estado de recurso fora do plano. O backend já recusa com 402 PLAN_REQUIRED —
 * isto é a versão legível disso, não a trava em si.
 */
export function PlanGate({ title, description }: PlanGateProps) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-elevated/60 px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full border border-line bg-elevated text-gold">
        <Crown className="size-6" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      <Link
        to="/app/plano"
        className="mt-5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
      >
        Ver os planos
      </Link>
    </div>
  );
}
