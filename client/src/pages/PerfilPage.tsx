import { LogOut, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RISK_LABEL } from '../lib/onboardingQuiz';

/**
 * Tela: Perfil — rota `/app/perfil`
 * Menu: rodapé
 * Dados da conta, perfil de risco (RISK_LABEL) e sair.
 */
export function PerfilPage() {
  const { profile, session, configured, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const email = profile?.email ?? session?.user.email ?? '—';
  const name = profile?.full_name ?? '—';
  const risk = profile?.risk_profile
    ? (RISK_LABEL[profile.risk_profile] ?? profile.risk_profile)
    : 'Ainda não definido';

  return (
    <section aria-labelledby="perfil-titulo" className="mx-auto max-w-3xl">
      <h2 id="perfil-titulo" className="mb-1 font-display text-2xl font-bold tracking-tight">
        Perfil
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Sua conta e preferências.</p>

      {!configured && (
        <p className="mb-6 rounded-2xl border border-line bg-elevated px-4 py-3 text-sm text-ink-muted">
          Modo demonstração — sem login. Configure o Supabase no <code>.env</code> para uma conta real.
        </p>
      )}

      <dl className="divide-y divide-line rounded-2xl border border-line bg-elevated">
        <Row term="Nome" desc={name} />
        <Row term="E-mail" desc={email} />
        <Row term="Perfil de investidor" desc={risk} />
        {profile?.is_admin && <Row term="Acesso" desc="Administrador" />}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/onboarding?redo=1"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          <RefreshCw className="size-4" aria-hidden />
          Refazer quiz de perfil
        </Link>
        {configured && (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
          >
            <LogOut className="size-4" aria-hidden />
            Sair da conta
          </button>
        )}
      </div>
    </section>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm text-ink-muted">{term}</dt>
      <dd className="text-sm font-medium">{desc}</dd>
    </div>
  );
}
