import { LogOut, MoreHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ACCOUNT_ITEMS,
  MARKET_ITEMS,
  PRIMARY_ITEMS,
  isItemActive,
  visibleItems,
} from '../../lib/navigation';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NavEntry } from './NavEntry';

/**
 * Barra inferior do mobile: os 4 destinos + "Mais", que abre um sheet com
 * Mercados, Conta, tema e Sair — tudo que a sidebar tem no desktop.
 */
export function MobileNav({ onSignOut }: { onSignOut: () => void }) {
  const { pathname } = useLocation();
  const { profile, configured } = useAuth();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const accountItems = visibleItems(ACCOUNT_ITEMS, Boolean(profile?.is_admin));
  const moreActive = [...MARKET_ITEMS, ...accountItems].some((item) =>
    isItemActive(item, pathname),
  );

  // Trocar de rota fecha o sheet (inclusive pelo voltar do navegador).
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    const trigger = moreRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <nav
        aria-label="Navegação principal (mobile)"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-elevated/90 px-0.5 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {PRIMARY_ITEMS.map((item) => {
          const active = isItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium tracking-tight transition-colors ${
                active ? 'text-gold' : 'text-ink-muted'
              }`}
            >
              <Icon className="size-5" aria-hidden />
              <span className="w-full truncate text-center">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          );
        })}
        <button
          ref={moreRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium tracking-tight transition-colors ${
            moreActive || open ? 'text-gold' : 'text-ink-muted'
          }`}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          Mais
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-elevated px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />

            <p className="mb-1 px-3 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
              Mercados
            </p>
            <div className="flex flex-col gap-1">
              {MARKET_ITEMS.map((item) => (
                <NavEntry key={item.to} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>

            <p className="mt-4 mb-1 px-3 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
              Conta
            </p>
            <div className="flex flex-col gap-1">
              {accountItems.map((item) => (
                <NavEntry key={item.to} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <div className="flex items-center gap-3 text-sm text-ink-muted">
                <ThemeToggle />
                Tema
              </div>
              <div className="flex items-center gap-2">
                {configured && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sair
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="grid size-11 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:text-ink"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
