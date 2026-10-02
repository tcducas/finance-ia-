import { Search, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminUsers,
  setUserPlan,
  type AdminUser,
  type Plan,
} from '../../services/account';
import { Skeleton } from '../ui/Skeleton';

/**
 * Concessão de plano. É a única forma de alguém virar Pro no app — não há
 * checkout. A rota atrás disto exige is_admin e recusa rebaixar o próprio plano.
 */
export function UserPlanTable() {
  const { profile, reloadProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers(q));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changePlan(user: AdminUser, plan: Plan) {
    setSavingId(user.id);
    setError(null);
    try {
      const updated = await setUserPlan(user.id, plan);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      // Mudou o próprio plano? O selo da topbar precisa acompanhar.
      if (updated.id === profile?.id) await reloadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao mudar o plano.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(query.trim() || undefined);
        }}
        className="mb-3 flex gap-2"
      >
        <label className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por e-mail ou nome"
            aria-label="Buscar usuário"
            className="w-full rounded-xl border border-line bg-elevated py-2 pr-3 pl-9 text-sm outline-none transition-colors focus:border-gold"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          Buscar
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <Skeleton className="h-32" />
      ) : users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
          Nenhum usuário encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-elevated">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Usuários e seus planos</caption>
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted uppercase tracking-wide">
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Usuário
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Desde
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Plano
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === profile?.id;
                return (
                  <tr key={user.id} className="border-b border-line last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="flex items-center gap-1.5 font-medium">
                        {user.full_name ?? '—'}
                        {user.is_admin && (
                          <Shield className="size-3.5 text-gold" aria-label="Administrador" />
                        )}
                        {isSelf && <span className="text-xs text-ink-muted">(você)</span>}
                      </span>
                      <span className="block text-xs text-ink-muted">{user.email ?? '—'}</span>
                    </th>
                    <td className="px-4 py-3 text-xs text-ink-muted tabular-nums">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.plan}
                        disabled={savingId === user.id}
                        onChange={(e) => void changePlan(user, e.target.value as Plan)}
                        aria-label={`Plano de ${user.full_name ?? user.email ?? 'usuário'}`}
                        className="rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm outline-none transition-colors focus:border-gold disabled:opacity-60"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                      </select>
                      {isSelf && user.plan === 'pro' && (
                        <span className="mt-1 block text-[11px] text-ink-muted">
                          rebaixar o próprio plano só pelo banco
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
