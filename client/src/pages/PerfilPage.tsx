import { User } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function PerfilPage() {
  return (
    <section aria-labelledby="perfil-titulo" className="mx-auto max-w-5xl">
      <h2 id="perfil-titulo" className="mb-1 text-2xl font-bold tracking-tight">
        Perfil
      </h2>
      <p className="mb-6 text-sm text-ink-muted">Sua conta e preferências.</p>
      <EmptyState
        icon={User}
        title="Em breve"
        description="Perfil do investidor e preferências chegam junto com a autenticação."
      />
    </section>
  );
}
