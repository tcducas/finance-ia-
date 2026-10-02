import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Vira o `<h2>` da tela; o `<h1>` é o mês, na topbar do MainLayout. */
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Botões à direita; empilham abaixo do título no mobile. */
  actions?: ReactNode;
  /** Id para o `aria-labelledby` da section que envolve a tela. */
  id: string;
}

/**
 * Cabeçalho de tela. Padroniza o que cada página vinha resolvendo à mão, com
 * espaçamento e tamanho ligeiramente diferentes em cada uma.
 */
export function PageHeader({ title, subtitle, icon: Icon, actions, id }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          id={id}
          className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
        >
          {Icon && <Icon className="size-6 text-gold" aria-hidden />}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
