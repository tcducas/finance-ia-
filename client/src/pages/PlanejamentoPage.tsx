import { Plus, RefreshCw, Target } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoalCard } from '../components/planning/GoalCard';
import { GoalForm } from '../components/planning/GoalForm';
import { ProjectionChart } from '../components/planning/ProjectionChart';
import { ScenarioTable } from '../components/planning/ScenarioTable';
import { ScoreCard } from '../components/planning/ScoreCard';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency } from '../lib/format';
import {
  createGoal,
  deleteGoal,
  fetchPlanning,
  planningAvailable,
  updateGoal,
} from '../services/planning';
import type { Goal, GoalInput, Planning } from '../types/planning';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Tela: Planejamento — rota `/app/planejamento`
 * Menu: "Planejamento" (3º item)
 * Metas, projeção de juros compostos, cenários e score de saúde financeira.
 * O motor de projeção é do backend (server/src/lib/projection.ts) — aqui só se
 * desenha o que ele devolve.
 */

const HORIZONS = [
  { months: 12, label: '1 ano' },
  { months: 36, label: '3 anos' },
  { months: 60, label: '5 anos' },
  { months: 120, label: '10 anos' },
];

export function PlanejamentoPage() {
  const available = planningAvailable();
  const [horizon, setHorizon] = useState(60);
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [loading, setLoading] = useState(available);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const refresh = useCallback(async () => {
    if (!available) return;
    setLoading(true);
    try {
      setPlanning(await fetchPlanning(horizon));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o planejamento.');
    } finally {
      setLoading(false);
    }
  }, [available, horizon]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSave(input: GoalInput) {
    if (editing) await updateGoal(editing.id, input);
    else await createGoal(input);
    await refresh();
  }

  async function handleRemove(id: string) {
    await deleteGoal(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  }

  if (!available) {
    return (
      <Shell>
        <EmptyState
          icon={Target}
          title="Entre para usar o Planejamento"
          description="As metas e a projeção de juros compostos são calculadas no servidor, com os seus dados — não funcionam no modo demonstração."
        />
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-gold underline">
            Entrar ou criar conta
          </Link>
        </p>
      </Shell>
    );
  }

  const goals = planning?.goals ?? [];
  const selected = goals.find((g) => g.goal.id === selectedId) ?? goals[0] ?? null;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex rounded-full border border-line p-1 text-sm"
          role="radiogroup"
          aria-label="Horizonte da projeção"
        >
          {HORIZONS.map((h) => (
            <button
              key={h.months}
              type="button"
              role="radio"
              aria-checked={horizon === h.months}
              onClick={() => setHorizon(h.months)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                horizon === h.months ? 'bg-gold text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
          >
            <Plus className="size-4" aria-hidden />
            Nova meta
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      {loading && !planning ? (
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      ) : planning ? (
        <div className="space-y-6">
          <ScoreCard
            score={planning.score}
            netWorth={planning.netWorth}
            reserve={planning.reserve}
          />

          <dl className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Sobra do mês" value={planning.summary.saldo} />
            <Kpi label="Comprometido com metas" value={planning.committedMonthly} />
            <Kpi
              label="Livre depois das metas"
              value={planning.freeMonthly}
              warn={planning.freeMonthly < 0}
            />
          </dl>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
                Minhas metas
              </h3>
              {goals.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="Nenhuma meta ainda"
                  description="Crie uma meta com valor-alvo e aporte mensal — a projeção mostra quando você chega lá."
                />
              ) : (
                <ul className="space-y-2" aria-label="Metas financeiras">
                  {goals.map((projection) => (
                    <GoalCard
                      key={projection.goal.id}
                      projection={projection}
                      selected={selected?.goal.id === projection.goal.id}
                      onSelect={() => setSelectedId(projection.goal.id)}
                      onEdit={() => {
                        setEditing(projection.goal);
                        setFormOpen(true);
                      }}
                      onRemove={() => void handleRemove(projection.goal.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
                Projeção {selected ? `· ${selected.goal.name}` : ''}
              </h3>
              {selected ? (
                <>
                  <div className="rounded-2xl border border-line bg-elevated p-4">
                    <ProjectionChart projection={selected} />
                  </div>
                  <div className="rounded-2xl border border-line bg-elevated p-4">
                    <h4 className="mb-2 text-sm font-semibold">Cenários de rentabilidade</h4>
                    <ScenarioTable scenarios={selected.scenarios} horizon={planning.horizon} />
                  </div>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
                  Crie uma meta para ver a projeção.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-muted">
            Projeção educativa baseada nos números que você informou — <strong>não é
            recomendação de investimento</strong>. Rentabilidade passada ou esperada não garante
            resultado futuro.
          </p>
        </div>
      ) : null}

      <GoalForm
        open={formOpen}
        goal={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="planejamento-titulo" className="mx-auto max-w-6xl">
      <h2 id="planejamento-titulo" className="mb-1 font-display text-2xl font-bold tracking-tight">
        Planejamento
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Metas, projeções e score financeiro.</p>
      {children}
    </section>
  );
}

function Kpi({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</dt>
      <dd
        className="mt-1 text-xl font-bold tabular-nums"
        style={warn ? { color: 'var(--status-bad)' } : undefined}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
