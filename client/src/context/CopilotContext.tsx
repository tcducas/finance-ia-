import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

export interface CopilotTarget {
  /** Tela em foco: carteira | gastos | investimentos | ativo | planejamento. */
  screen: string;
  ticker?: string;
  /** Mensagem inicial a disparar ao abrir (ex.: "explique este ativo"). */
  kickoff?: string;
}

interface CopilotContextValue {
  open: boolean;
  target: CopilotTarget;
  openCopilot(): void;
  openWith(target: Partial<CopilotTarget>): void;
  closeCopilot(): void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

/** Remove o prefixo /app das rotas do app autenticado. */
function appPath(pathname: string): string {
  return pathname.replace(/^\/app/, '') || '/';
}

function screenFromPath(pathname: string): string {
  const p = appPath(pathname);
  if (p.startsWith('/gastos')) return 'gastos';
  if (p.startsWith('/planejamento')) return 'planejamento';
  if (/^\/investimentos\/.+/.test(p)) return 'ativo';
  if (p.startsWith('/investimentos')) return 'investimentos';
  return 'carteira';
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState<Partial<CopilotTarget> | null>(null);

  const target = useMemo<CopilotTarget>(() => {
    const screen = screenFromPath(location.pathname);
    const ticker =
      screen === 'ativo'
        ? decodeURIComponent(appPath(location.pathname).split('/')[2] ?? '')
        : undefined;
    return { screen, ticker, ...override };
  }, [location.pathname, override]);

  const openCopilot = useCallback(() => {
    setOverride(null);
    setOpen(true);
  }, []);

  const openWith = useCallback((next: Partial<CopilotTarget>) => {
    setOverride(next);
    setOpen(true);
  }, []);

  const closeCopilot = useCallback(() => {
    setOpen(false);
    setOverride(null);
  }, []);

  const value = useMemo(
    () => ({ open, target, openCopilot, openWith, closeCopilot }),
    [open, target, openCopilot, openWith, closeCopilot],
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error('useCopilot precisa do CopilotProvider.');
  return ctx;
}
