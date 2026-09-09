import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QUIZ } from '../lib/onboardingQuiz';
import { submitOnboarding } from '../services/account';

export function OnboardingPage() {
  const { configured, session, profile, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redo = params.get('redo') === '1';
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = QUIZ.every((q) => answers[q.key] !== undefined);

  if (configured && !session) return <Navigate to="/login" replace />;
  if (!configured) return <Navigate to="/app" replace />;
  if (profile?.onboarded_at && !redo) return <Navigate to="/app" replace />;

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await submitOnboarding(answers);
      await reloadProfile();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar seu perfil.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gold">Boas-vindas</p>
      <h1 className="text-2xl font-bold tracking-tight">Vamos descobrir seu perfil de investidor</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Cinco perguntas rápidas. O resultado orienta as sugestões do copiloto — você pode refazer
        quando quiser no Perfil.
      </p>

      <div className="mt-8 space-y-8">
        {QUIZ.map((q, i) => (
          <fieldset key={q.key}>
            <legend className="mb-3 text-sm font-semibold">
              {i + 1}. {q.prompt}
            </legend>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.key] === opt.score;
                return (
                  <label
                    key={opt.label}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      selected
                        ? 'border-gold bg-gold/10 text-ink'
                        : 'border-line hover:border-gold/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.key}
                      className="accent-gold"
                      checked={selected}
                      onChange={() => setAnswers((a) => ({ ...a, [q.key]: opt.score }))}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!complete || busy}
        onClick={() => void finish()}
        className="mt-8 w-full rounded-full bg-gold px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-strong disabled:opacity-50"
      >
        {busy ? 'Salvando…' : 'Concluir e entrar'}
      </button>
    </div>
  );
}
