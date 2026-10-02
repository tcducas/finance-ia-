import { Link, useLocation } from 'react-router-dom';
import { isItemActive, type NavItem } from '../../lib/navigation';

interface NavEntryProps {
  item: NavItem;
  /** Só ícone (sidebar recolhida); o rótulo vira tooltip e nome acessível. */
  compact?: boolean;
  onNavigate?: () => void;
}

/**
 * Link de menu com o destaque ativo decidido por `isItemActive` — o mesmo
 * critério na sidebar e no sheet do mobile. Ativo = fundo + barra lateral,
 * não só a cor do texto.
 */
export function NavEntry({ item, compact = false, onNavigate }: NavEntryProps) {
  const { pathname } = useLocation();
  const active = isItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? item.label : undefined}
      title={compact ? item.label : undefined}
      className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
        compact ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gold/10 text-gold before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-gold'
          : 'text-ink-muted hover:bg-canvas hover:text-ink'
      }`}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!compact && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
