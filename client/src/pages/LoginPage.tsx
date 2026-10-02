import { type FormEvent, useState } from 'react';
import { LineChart, Lock, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

/**
 * Tela: Login/Cadastro — rota `/login` (pública)
 * Menu: — (fora do app autenticado)
 * Entrada/criação de conta via Supabase Auth; alterna signin/signup.
 */
export function LoginPage() {
  const { session, configured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (configured && session) return <Navigate to="/app" replace />;

  if (!configured) {
    return (
      <Shell>
        <p className="text-sm text-ink-muted">
          Supabase não está configurado neste ambiente. Preencha <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> no <code>.env</code> para habilitar o login, ou use o
          app em <Link to="/app" className="text-gold underline">modo demonstração</Link>.
        </p>
      </Shell>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, fullName.trim());
        setNotice(
          'Conta criada. Se a confirmação de e-mail estiver ativa no projeto, verifique sua caixa de entrada antes de entrar.',
        );
        setMode('signin');
      } else {
        await signIn(email.trim(), password);
        // O redirecionamento acontece sozinho quando a sessão chega (Navigate acima).
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mb-6 flex rounded-full border border-line p-1 text-sm">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-full px-4 py-1.5 font-medium transition-colors ${
              mode === m ? 'bg-gold text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {m === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Field label="Nome">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />
          </Field>
        )}
        <Field label="E-mail">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm" style={{ color: 'var(--status-bad)' }}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-ink-muted">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong disabled:opacity-60"
        >
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </Shell>
  );
}

const inputClass =
  'w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm outline-none focus:border-gold';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      {/* Formulário */}
      <div className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gold font-extrabold text-white">
              A
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Aura Finance</span>
          </Link>
          <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">
            Entre na sua conta
          </h1>
          <p className="mb-6 text-sm text-ink-muted">
            Seus dados ficam isolados por usuário no banco, com RLS.
          </p>
          {children}
        </div>
      </div>

      {/* Painel de marca — some no mobile, onde o formulário é o que importa. */}
      <aside className="relative hidden items-center overflow-hidden border-l border-line bg-elevated/50 px-12 lg:flex">
        <div className="aurora" aria-hidden />
        <div className="relative max-w-md">
          <p className="text-sm font-medium tracking-widest text-gold uppercase">
            Copiloto financeiro
          </p>
          <p className="mt-4 font-display text-3xl leading-tight font-bold tracking-tight text-balance">
            Saiba onde investir — e por quê.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: 'Não executa ordens',
                text: 'O app analisa e direciona. Quem aplica é você, na sua corretora.',
              },
              {
                icon: Lock,
                title: 'Anonimizado antes da IA',
                text: 'Vão tickers e percentuais; nunca nome, CPF ou patrimônio absoluto.',
              },
              {
                icon: LineChart,
                title: 'Método à mostra',
                text: 'VPL, TIR, payback e concentração — cada número com o cálculo explicado.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-gold">
                  <item.icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-ink-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
