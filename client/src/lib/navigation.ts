import {
  Bitcoin,
  Building2,
  ChartPie,
  Crown,
  Globe,
  Shield,
  Target,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** `prefix` mantém o item aceso nas sub-rotas (ex.: detalhe do ativo). */
  match: 'exact' | 'prefix';
  /** Rótulo da barra inferior do mobile, onde a largura é de ~70px. */
  shortLabel?: string;
  adminOnly?: boolean;
}

/**
 * Fonte única da navegação do app — sidebar, barra mobile, sheet "Mais" e
 * topbar leem daqui, para os quatro nunca divergirem.
 */

/** Os 4 destinos principais (doc v0.4). */
export const PRIMARY_ITEMS: NavItem[] = [
  { to: '/app', label: 'Minha Carteira', shortLabel: 'Carteira', icon: Wallet, match: 'exact' },
  { to: '/app/gastos', label: 'Gastos', icon: ChartPie, match: 'prefix' },
  {
    to: '/app/planejamento',
    label: 'Planejamento',
    icon: Target,
    match: 'prefix',
  },
  {
    to: '/app/investimentos',
    label: 'Investimentos',
    icon: TrendingUp,
    match: 'prefix',
  },
];

/** Boards de mercado, agrupados abaixo dos destinos principais. */
export const MARKET_ITEMS: NavItem[] = [
  { to: '/app/acoes', label: 'Ações B3', icon: Building2, match: 'prefix' },
  { to: '/app/cripto', label: 'Cripto', icon: Bitcoin, match: 'prefix' },
  { to: '/app/internacional', label: 'Internacional', icon: Globe, match: 'prefix' },
];

export const ACCOUNT_ITEMS: NavItem[] = [
  { to: '/app/perfil', label: 'Perfil', icon: User, match: 'prefix' },
  { to: '/app/plano', label: 'Planos', icon: Crown, match: 'prefix' },
  { to: '/app/admin', label: 'Admin', icon: Shield, match: 'prefix', adminOnly: true },
];

export function isItemActive(item: NavItem, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (item.match === 'exact') return path === item.to;
  return path === item.to || path.startsWith(`${item.to}/`);
}

export function visibleItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}

export interface RouteMeta {
  title: string;
  parent?: { to: string; label: string };
}

const ALL_ITEMS = [...PRIMARY_ITEMS, ...MARKET_ITEMS, ...ACCOUNT_ITEMS];

/** Título da tela atual e, em sub-rota, para onde o "voltar" leva. */
export function routeMeta(pathname: string): RouteMeta {
  const path = pathname.replace(/\/+$/, '') || '/';

  const exact = ALL_ITEMS.find((item) => item.to === path);
  if (exact) return { title: exact.label };

  const detail = /^\/app\/investimentos\/([^/]+)$/.exec(path);
  if (detail?.[1]) {
    const raw = decodeURIComponent(detail[1]);
    // Ticker chega prefixado (`BR:PETR4`); o título mostra só o símbolo.
    const title = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
    return { title, parent: { to: '/app/investimentos', label: 'Investimentos' } };
  }

  const owner = ALL_ITEMS.find((item) => item.match === 'prefix' && isItemActive(item, path));
  return { title: owner?.label ?? 'Aura Finance' };
}
