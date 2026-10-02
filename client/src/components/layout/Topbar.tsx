import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYear } from '../../lib/format';
import { routeMeta } from '../../lib/navigation';
import { ThemeToggle } from '../ui/ThemeToggle';

/** Diz em que tela o usuário está e, em sub-rota, leva de volta ao pai. */
export function Topbar() {
  const { pathname } = useLocation();
  const { profile, configured } = useAuth();
  const { openCopilot } = useCopilot();
  const { openTransactionForm } = useFinance();
  const meta = routeMeta(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {meta.parent ? (
          <Link
            to={meta.parent.to}
            aria-label={`Voltar para ${meta.parent.label}`}
            title={`Voltar para ${meta.parent.label}`}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-elevated text-ink-muted transition-colors hover:border-gold hover:text-gold"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold text-sm font-extrabold text-on-gold md:hidden">
            A
          </span>
        )}

        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="truncate font-display text-base font-bold tracking-tight md:text-xl">
              {meta.title}
            </span>
            {profile && (
              <NavLink
                to="/app/plano"
                title={profile.plan === 'pro' ? 'Plano Pro' : 'Plano Free — ver os planos'}
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  profile.plan === 'pro'
                    ? 'bg-gold text-on-gold'
                    : 'border border-line text-ink-muted hover:border-gold hover:text-gold'
                }`}
              >
                {profile.plan === 'pro' ? 'Pro' : 'Free'}
              </NavLink>
            )}
            {!configured && (
              <span
                className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                title="Supabase não configurado — os dados vivem só neste navegador (placeholder)."
              >
                demo
              </span>
            )}
          </p>
          <p className="truncate text-xs text-ink-muted first-letter:uppercase">
            {meta.parent ? `${meta.parent.label} · ` : ''}
            {formatMonthYear(new Date())}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden sm:block">
          <ThemeToggle />
        </span>
        <button
          type="button"
          onClick={openCopilot}
          aria-label="Abrir copiloto"
          title="Copiloto Aura"
          className="grid size-10 place-items-center rounded-full border border-line bg-elevated text-gold transition-colors hover:border-gold"
        >
          <Sparkles className="size-5" />
        </button>
        <button
          type="button"
          onClick={openTransactionForm}
          aria-label="Nova movimentação"
          title="Nova movimentação"
          className="flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-on-gold shadow-sm transition-colors hover:bg-gold-strong"
        >
          <Plus className="size-5" aria-hidden />
          <span className="hidden sm:inline">Nova</span>
        </button>
      </div>
    </header>
  );
}
