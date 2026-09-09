import { Shield } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

/** Área administrativa — acesso controlado pela flag is_admin em profiles. */
export function AdminPage() {
  return (
    <section aria-labelledby="admin-titulo" className="mx-auto max-w-5xl">
      <h2 id="admin-titulo" className="mb-1 text-2xl font-bold tracking-tight">
        Admin
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Administração do Aura.</p>
      <EmptyState
        icon={Shield}
        title="Em breve"
        description="A área administrativa chega junto com a autenticação (flag is_admin)."
      />
    </section>
  );
}
