import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ACCOUNT_ITEMS, MARKET_ITEMS, PRIMARY_ITEMS, visibleItems } from '../../lib/navigation';
import { NavEntry } from './NavEntry';

const COLLAPSED_KEY = 'aura:sidebar-collapsed';

/** Preferência por navegador; sem storage disponível a sidebar abre expandida. */
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // Storage bloqueado (aba privada): a preferência vale só nesta sessão.
  }
}

export function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const { profile, configured } = useAuth();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const accountItems = visibleItems(ACCOUNT_ITEMS, Boolean(profile?.is_admin));

  function toggle() {
    setCollapsed((current) => {
      writeCollapsed(!current);
      return !current;
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-elevated/70 py-6 backdrop-blur transition-[width] duration-200 md:flex ${
        collapsed ? 'w-[4.5rem] px-2' : 'w-60 px-4'
      }`}
    >
      <div className={`mb-8 flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold font-extrabold text-on-gold">
          A
        </span>
        {!collapsed && (
          <span className="font-display text-lg font-bold tracking-tight">Aura Finance</span>
        )}
      </div>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {PRIMARY_ITEMS.map((item) => (
          <NavEntry key={item.to} item={item} compact={collapsed} />
        ))}

        {collapsed ? (
          <hr className="mx-2 my-3 border-line" />
        ) : (
          <p className="mt-5 mb-1 px-3 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
            Mercados
          </p>
        )}
        {MARKET_ITEMS.map((item) => (
          <NavEntry key={item.to} item={item} compact={collapsed} />
        ))}
      </nav>

      <div className="mt-6 flex flex-col gap-1 border-t border-line pt-4">
        {accountItems.map((item) => (
          <NavEntry key={item.to} item={item} compact={collapsed} />
        ))}
        {configured && (
          <button
            type="button"
            onClick={onSignOut}
            aria-label={collapsed ? 'Sair' : undefined}
            title={collapsed ? 'Sair' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            {!collapsed && 'Sair'}
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5 shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" aria-hidden />
              Recolher
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
