import {
  Bitcoin,
  Building2,
  ChartPie,
  Crown,
  Globe,
  LogOut,
  Plus,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CopilotDrawer } from '../components/copilot/CopilotDrawer';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useCopilot } from '../context/CopilotContext';
import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Os 4 destinos principais do produto (doc v0.4): menos itens de topo = mais
 * fácil de navegar. Os boards de mercado ficam agrupados em "Mercados" logo
 * abaixo, cada um com rota própria.
 */
const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Minha Carteira', icon: Wallet },
  { to: '/app/gastos', label: 'Gastos', icon: ChartPie },
  { to: '/app/planejamento', label: 'Planejamento', icon: Target },
];

const MARKET_ITEMS: NavItem[] = [
  { to: '/app/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/app/acoes', label: 'Ações B3', icon: Building2 },
  { to: '/app/cripto', label: 'Cripto', icon: Bitcoin },
  { to: '/app/internacional', label: 'Internacional', icon: Globe },
];

/** Barra inferior do mobile: 4 destinos + um atalho que leva ao hub de mercados. */
const MOBILE_ITEMS: NavItem[] = [
  ...NAV_ITEMS,
  { to: '/app/investimentos', label: 'Mercados', icon: TrendingUp },
];

const FOOTER_ITEMS: NavItem[] = [
  { to: '/app/perfil', label: 'Perfil', icon: User },
  { to: '/app/plano', label: 'Planos', icon: Crown },
  { to: '/app/admin', label: 'Admin', icon: Shield },
];

function navLinkClass(base: string) {
  return ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? 'text-gold' : 'text-ink-muted hover:text-ink'}`;
}

export function MainLayout() {
  const { openCopilot } = useCopilot();
  const { openTransactionForm } = useFinance();
  const { profile, configured, signOut } = useAuth();
  const navigate = useNavigate();

  const footerItems = FOOTER_ITEMS.filter(
    (item) => item.to !== '/app/admin' || profile?.is_admin,
  );

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

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
              end={to === '/app'}
              className={navLinkClass(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-canvas',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}

          <p className="mt-5 mb-1 px-3 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
            Mercados
          </p>
          {MARKET_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={navLinkClass(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-canvas',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-1 border-t border-line pt-4">
          {footerItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={navLinkClass(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-canvas',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
          {configured && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </button>
          )}
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
            {profile && (
              <NavLink
                to="/app/plano"
                title={profile.plan === 'pro' ? 'Plano Pro' : 'Plano Free — ver os planos'}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  profile.plan === 'pro'
                    ? 'bg-gold text-white'
                    : 'border border-line text-ink-muted hover:border-gold hover:text-gold'
                }`}
              >
                {profile.plan === 'pro' ? 'Pro' : 'Free'}
              </NavLink>
            )}
            {!configured && (
              <span
                className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                title="Supabase não configurado — os dados vivem só neste navegador (placeholder)."
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
        {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/app'}
            className={navLinkClass(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="w-full truncate text-center">{label}</span>
          </NavLink>
        ))}
      </nav>

      <CopilotDrawer />

      <TransactionForm />
    </div>
  );
}
