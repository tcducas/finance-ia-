import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Portão do /app:
 * - Supabase não configurado → segue (modo demo local).
 * - Sem sessão → /login.
 * - Sessão sem onboarding → /onboarding.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, configured, session, profile, profileError, reloadProfile } = useAuth();

  if (!configured) return <>{children}</>;
  if (!ready) return <FullScreenMessage text="Carregando…" />;
  if (!session) return <Navigate to="/login" replace />;

  if (profileError) {
    return (
      <FullScreenMessage text={`Não foi possível carregar seu perfil. ${profileError}`}>
        <button
          type="button"
          onClick={() => void reloadProfile()}
          className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold-strong"
        >
          Tentar de novo
        </button>
      </FullScreenMessage>
    );
  }

  if (profile && !profile.onboarded_at) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function FullScreenMessage({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">{text}</p>
        {children}
      </div>
    </div>
  );
}
