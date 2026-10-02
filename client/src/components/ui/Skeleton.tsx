interface SkeletonProps {
  /** Classe de altura do Tailwind (ex.: 'h-20'). */
  className?: string;
  /** Repete o bloco; usado em listas. */
  rows?: number;
  'aria-label'?: string;
}

/**
 * Placeholder de carregamento. Existe para o pulse ficar num só lugar: antes
 * disto eram 16 `animate-pulse` soltos em 10 arquivos, cada um com um raio e uma
 * altura diferentes.
 *
 * `aria-hidden` porque é decoração — quem anuncia o carregamento é o container,
 * com `aria-busy` ou um `role="status"` próprio.
 */
export function Skeleton({ className = 'h-20', rows = 1 }: SkeletonProps) {
  if (rows > 1) {
    return (
      <div className="space-y-2" aria-hidden>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={`animate-pulse rounded-2xl bg-line/60 ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`animate-pulse rounded-2xl bg-line/60 ${className}`} aria-hidden />;
}
