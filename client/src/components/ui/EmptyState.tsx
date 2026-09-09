import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-elevated/60 px-6 py-16 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full border border-line bg-elevated text-gold">
        <Icon className="size-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
    </div>
  );
}
