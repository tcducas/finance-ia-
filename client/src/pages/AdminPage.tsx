import { MessageSquare, ReceiptText, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from '../components/ui/StatCard';
import { type AdminStats, fetchAdminStats } from '../services/account';

/**
 * Tela: Admin — rota `/app/admin`
 * Menu: rodapé (visível só para is_admin=true, protegida por RequireAdmin)
 * Estatísticas globais da plataforma (usuários, transações, mensagens de IA).
 */
export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAdminStats()
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Falha ao carregar.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="admin-titulo" className="mx-auto max-w-5xl">
      <h2 id="admin-titulo" className="mb-1 text-2xl font-bold tracking-tight">
        Admin
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Números gerais da plataforma.</p>

      {error && (
        <p role="alert" className="mb-4 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Usuários" value={fmt(stats?.users)} loading={loading} />
        <StatCard
          icon={ReceiptText}
          label="Movimentações"
          value={fmt(stats?.transactions)}
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          label="Mensagens de IA"
          value={fmt(stats?.aiMessages)}
          loading={loading}
        />
        <StatCard
          icon={Star}
          label="Itens em watchlist"
          value={fmt(stats?.watchlistItems)}
          loading={loading}
        />
      </div>
    </section>
  );
}

function fmt(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString('pt-BR');
}
