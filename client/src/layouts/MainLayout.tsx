import {
  ChartPie,
  Plus,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { CopilotDrawer } from '../components/copilot/CopilotDrawer';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useCopilot } from '../context/CopilotContext';
import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../lib/format';
import { isDemoMode } from '../services/data';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Minha Carteira', icon: Wallet },
  { to: '/gastos', label: 'Gastos', icon: ChartPie },
  { to: '/planejamento', label: 'Planejamento', icon: Target },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
];

const FOOTER_ITEMS: NavItem[] = [
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/admin', label: 'Admin', icon: Shield },
];

function navLinkClass(base: string) {
  return ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? 'text-gold' : 'text-ink-muted hover:text-ink'}`;
}

export function MainLayout() {
  const { openCopilot } = useCopilot();
  const { openTransactionForm } = useFinance();

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 flex-col border-r border-line bg-elevated/70 px-4 py-6 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gold font-extrabold text-white">
            A
          </span>
          <span className="text-lg font-bold tracking-tight">Aura Finance</span>
        </div>

        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={navLinkClass(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-canvas',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-1 border-t border-line pt-4">
          {FOOTER_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={navLinkClass(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-canvas',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-gold text-sm font-extrabold text-white">
              A
            </span>
          </div>
          <h1 className="flex items-center gap-2 text-base font-semibold md:text-xl">
            {formatMonthYear(new Date())}
            {isDemoMode() && (
              <span
                className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                title="Sem login configurado — os dados vivem só neste navegador (placeholder)."
              >
                demo
              </span>
            )}
          </h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />
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
              className="flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-strong"
            >
              <Plus className="size-5" aria-hidden />
              <span className="hidden sm:inline">Nova</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior — mobile */}
      <nav
        aria-label="Navegação principal (mobile)"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-elevated/90 px-2 py-2 backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={navLinkClass(
              'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <CopilotDrawer />

      <TransactionForm />
    </div>
  );
}
